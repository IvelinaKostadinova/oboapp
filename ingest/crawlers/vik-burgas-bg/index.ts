#!/usr/bin/env node

import dotenv from "dotenv";
import { resolve } from "node:path";
import type { Browser, Page } from "playwright";
import type { OboDb } from "@oboapp/db";
import type { PostLink } from "./types";
import { extractPostLinks, extractPostDetails } from "./extractors";
import {
  crawlWordpressPage,
  processWordpressPost,
} from "../shared/webpage-crawlers";
import { parseBulgarianDate } from "../shared/date-utils";
import { logger } from "@/lib/logger";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const INDEX_URL = "https://vik-burgas.com/news";
const SOURCE_TYPE = "vik-burgas-bg";
const LOCALITY = "bg.burgas";
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

/**
 * Process a single post.
 *
 * vik-burgas.com detail pages do not include a publication date, so we inject
 * the date captured from the listing page into the extracted details before
 * building the source document.
 */
const processPost = (browser: Browser, postLink: PostLink, db: OboDb) => {
  const extractWithDate = async (page: Page) => {
    const details = await extractPostDetails(page);
    return { ...details, dateText: details.dateText || postLink.date };
  };

  return processWordpressPost(
    browser,
    postLink,
    db,
    SOURCE_TYPE,
    LOCALITY,
    DELAY_BETWEEN_REQUESTS,
    extractWithDate,
    parseBulgarianDate,
  );
};

/**
 * Main crawler function
 */
export async function crawl(): Promise<void> {
  await crawlWordpressPage({
    indexUrl: INDEX_URL,
    sourceType: SOURCE_TYPE,
    extractPostLinks,
    processPost,
    delayBetweenRequests: DELAY_BETWEEN_REQUESTS,
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
