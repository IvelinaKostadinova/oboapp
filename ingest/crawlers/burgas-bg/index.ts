#!/usr/bin/env node

import dotenv from "dotenv";
import { resolve } from "node:path";
import { Browser } from "playwright";
import type { OboDb } from "@oboapp/db";
import { PostLink } from "./types";
import { extractPostLinks, extractPostDetails } from "./extractors";
import {
  crawlWordpressPage,
  processWordpressPost,
} from "../shared/webpage-crawlers";
import { BULGARIAN_MONTH_TO_NUMBER } from "../shared/date-utils";
import { logger } from "@/lib/logger";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const INDEX_URL = "https://www.burgas.bg/bg/novini";
const SOURCE_TYPE = "burgas-bg";
const LOCALITY = "bg.burgas";
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

/**
 * Parse a burgas.bg date string to ISO format.
 *
 * Handles two input shapes:
 *   1. Post detail page `.event-meta .float-left` text:
 *      "Събота, 18 Април 2026\nПубликувано от: Женя Петкова"
 *      → extract "18 Април 2026" with a regex
 *   2. Index page <time datetime="…"> attribute (fallback):
 *      "2026-04-17 11:02:07"
 *      → parse as ISO-like datetime in Europe/Sofia timezone
 */
export function parseBurgasDate(dateText: string, fallback?: string): string {
  const text = dateText.replace(/\s+/g, " ").trim();

  // Shape 1: "дд Месец гггг" possibly preceded by weekday + comma.
  const bgMatch = text.match(/(\d{1,2})\s+([а-яА-Я]+)\s+(\d{4})/);
  if (bgMatch) {
    const [, day, monthName, year] = bgMatch;
    const monthNum = BULGARIAN_MONTH_TO_NUMBER[monthName.toLowerCase()];
    if (monthNum) {
      const month = monthNum.toString().padStart(2, "0");
      const d = day.padStart(2, "0");
      const parsed = new Date(`${year}-${month}-${d}T00:00:00+02:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }

  // Shape 2: ISO-like fallback from <time datetime> attribute.
  const fallbackText = (fallback ?? "").trim();
  if (fallbackText) {
    const isoMatch = fallbackText.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
    if (isoMatch) {
      const parsed = new Date(`${isoMatch[1]}T${isoMatch[2]}+02:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }

  logger.warn("Unable to parse burgas date, using current date", {
    sourceType: SOURCE_TYPE,
    dateText,
    fallback: fallbackText,
  });
  return new Date().toISOString();
}

const processPost = (browser: Browser, postLink: PostLink, db: OboDb) =>
  processWordpressPost(
    browser,
    postLink,
    db,
    SOURCE_TYPE,
    LOCALITY,
    DELAY_BETWEEN_REQUESTS,
    extractPostDetails,
    (dateText) => parseBurgasDate(dateText, postLink.date),
  );

export async function crawl(): Promise<void> {
  await crawlWordpressPage({
    indexUrl: INDEX_URL,
    sourceType: SOURCE_TYPE,
    extractPostLinks,
    processPost,
    delayBetweenRequests: DELAY_BETWEEN_REQUESTS,
  });
}

if (require.main === module) {
  crawl().catch((error) => {
    logger.error("Fatal error", {
      error: error instanceof Error ? error.message : String(error),
      sourceType: SOURCE_TYPE,
    });
    process.exit(1);
  });
}
