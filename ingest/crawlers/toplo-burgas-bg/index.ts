#!/usr/bin/env node

import dotenv from "dotenv";
import { resolve } from "node:path";
import type { OboDb } from "@oboapp/db";
import type { FeedItem } from "./types";
import {
  fetchFeedXml,
  parseFeedItems,
  extractContentHtml,
  parseFeedDate,
} from "./extractors";
import { buildWebPageSourceDocument } from "../shared/webpage-crawlers";
import { isUrlProcessed, saveSourceDocument } from "../shared/firestore";
import { delay } from "@/lib/delay";
import { logger } from "@/lib/logger";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const SOURCE_TYPE = "toplo-burgas-bg";
const LOCALITY = "bg.burgas";
const DELAY_BETWEEN_REQUESTS = 500;

async function processItem(item: FeedItem, db: OboDb): Promise<void> {
  logger.debug("Processing feed item", {
    sourceType: SOURCE_TYPE,
    url: item.url,
    title: item.title.substring(0, 60),
  });

  const contentHtml = extractContentHtml(item.contentEncodedHtml);
  const doc = buildWebPageSourceDocument({
    url: item.url,
    title: item.title,
    dateText: item.pubDate,
    contentHtml,
    sourceType: SOURCE_TYPE,
    locality: LOCALITY,
    customDateParser: parseFeedDate,
  });

  await saveSourceDocument(
    {
      ...doc,
      crawledAt: new Date(),
    },
    db,
    { logSuccess: false },
  );

  logger.debug("Saved item", {
    sourceType: SOURCE_TYPE,
    url: item.url,
    title: item.title.substring(0, 60),
  });
}

export async function crawl(): Promise<void> {
  const { getDb } = await import("@/lib/db");
  const db = await getDb();

  logger.info("Fetching RSS feed", { sourceType: SOURCE_TYPE });
  const xml = await fetchFeedXml();
  const items = parseFeedItems(xml);

  logger.info("Parsed feed items", { sourceType: SOURCE_TYPE, total: items.length });

  let saved = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    if (await isUrlProcessed(item.url, db)) {
      logger.debug("Skipping already-processed URL", {
        sourceType: SOURCE_TYPE,
        url: item.url,
      });
      skipped++;
      continue;
    }

    try {
      await processItem(item, db);
      saved++;
    } catch (error) {
      logger.error("Failed to process item", {
        sourceType: SOURCE_TYPE,
        url: item.url,
        error: error instanceof Error ? error.message : String(error),
      });
      failed++;
    }

    await delay(DELAY_BETWEEN_REQUESTS);
  }

  logger.info("Crawl complete", {
    sourceType: SOURCE_TYPE,
    total: items.length,
    saved,
    skipped,
    failed,
  });
}

if (require.main === module) {
  crawl().catch((error) => {
    logger.error("Fatal error", {
      sourceType: SOURCE_TYPE,
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}
