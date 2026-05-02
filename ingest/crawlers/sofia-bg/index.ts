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

  // Filter out already-processed URLs before launching the browser so that
  // steady-state runs (all posts already seen) pay no Chromium startup cost.
  // NOTE: The RSS feed exposes /content/id/{id} Liferay URLs. The previous
  // Playwright-based crawler stored /w/{slug} URLs. These are different
  // Liferay URL schemes with no simple mapping between them.
  // On the first production run after this change, posts previously stored
  // under /w/ URLs will appear unprocessed here and be re-saved once under
  // the new /content/id/ scheme. This is an accepted one-time transition cost.
  const newPostLinks = (
    await Promise.all(
      postLinks.map(async (p) => ({
        postLink: p,
        processed: await isUrlProcessed(p.url, db),
      })),
    )
  )
    .filter(({ processed }) => !processed)
    .map(({ postLink }) => postLink);

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
