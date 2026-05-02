#!/usr/bin/env node

import dotenv from "dotenv";
import { resolve } from "node:path";
import type { Page } from "playwright";
import type { PostLink } from "./types";
import { fetchFeedXml, parseFeedItems, extractPostDetails } from "./extractors";
import { processWordpressPost } from "../shared/webpage-crawlers";
import { launchBrowser } from "../shared/browser";
import { isUrlProcessed } from "../shared/firestore";
import { logger } from "@/lib/logger";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const RSS_URL =
  "https://www.sofia.bg/repairs-and-traffic-changes/-/asset_publisher/utdu/rss";
const SOURCE_TYPE = "sofia-bg";
const LOCALITY = "bg.sofia";
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

/**
 * Main crawler function
 */
export async function crawl(): Promise<void> {
  const { getDb } = await import("@/lib/db");
  const db = await getDb();

  logger.info("Starting crawler", { sourceType: SOURCE_TYPE });

  let postLinks: PostLink[];
  try {
    const xml = await fetchFeedXml(RSS_URL);
    postLinks = parseFeedItems(xml);
  } catch (err) {
    logger.error("Failed to fetch RSS feed", {
      sourceType: SOURCE_TYPE,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  if (postLinks.length === 0) {
    logger.warn("No posts found in RSS feed", { sourceType: SOURCE_TYPE });
    return;
  }

  logger.info("Fetched post list", {
    sourceType: SOURCE_TYPE,
    count: postLinks.length,
  });

  // Build a set of titles already stored for this source type.
  // The RSS feed exposes /content/id/{id} Liferay URLs; the previous crawler
  // stored /w/{slug} URLs. There is no deterministic URL-to-URL mapping, so
  // title matching is used as a fallback: if an existing source document has
  // the same title as an RSS item, that article was already processed under
  // the old scheme and must not create a second source document (which would
  // cause from-sources to ingest it again as a duplicate message).
  const existingSources = await db.sources.findMany({
    where: [{ field: "sourceType", op: "==", value: SOURCE_TYPE }],
    select: ["title"],
  });
  const existingTitles = new Set<string>(
    existingSources
      .map((s) => (typeof s.title === "string" ? s.title : ""))
      .filter(Boolean),
  );

  // Filter out already-processed URLs (or already-seen titles) before
  // launching the browser so that steady-state runs pay no Chromium startup cost.
  // Promise.allSettled is used so that a single failed DB lookup does not abort
  // the entire pre-filter step; a rejected lookup is treated as "not processed"
  // so the post is attempted (worst case: a harmless upsert on a duplicate).
  const settled = await Promise.allSettled(
    postLinks.map(async (p) => ({
      postLink: p,
      processed: (await isUrlProcessed(p.url, db)) || existingTitles.has(p.title),
    })),
  );
  const newPostLinks: PostLink[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled" && !result.value.processed) {
      newPostLinks.push(result.value.postLink);
    }
  }

  const skipped = postLinks.length - newPostLinks.length;

  if (newPostLinks.length === 0) {
    logger.info("Crawl complete", {
      sourceType: SOURCE_TYPE,
      total: postLinks.length,
      saved: 0,
      skipped,
      failed: 0,
    });
    return;
  }

  const browser = await launchBrowser();
  let saved = 0,
    failed = 0;

  try {
    for (const postLink of newPostLinks) {
      try {
        // Inject the RSS date into the extracted details since the detail
        // page does not expose a machine-readable date element.
        const extractDetailsWithDate = async (page: Page) => {
          const details = await extractPostDetails(page);
          return { ...details, dateText: postLink.date };
        };

        await processWordpressPost(
          browser,
          postLink,
          db,
          SOURCE_TYPE,
          LOCALITY,
          DELAY_BETWEEN_REQUESTS,
          extractDetailsWithDate,
          (d) => d, // date is already ISO 8601 from the RSS feed
        );
        saved++;
      } catch (err) {
        failed++;
        logger.warn("Failed to process post", {
          sourceType: SOURCE_TYPE,
          url: postLink.url,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } finally {
    await browser.close();
  }

  logger.info("Crawl complete", {
    sourceType: SOURCE_TYPE,
    total: postLinks.length,
    saved,
    skipped,
    failed,
  });
}

// Run the crawler if executed directly
if (require.main === module) {
  crawl().catch((error) => {
    logger.error("Fatal error", {
      sourceType: SOURCE_TYPE,
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}
