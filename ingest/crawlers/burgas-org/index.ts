#!/usr/bin/env node

import dotenv from "dotenv";
import { resolve } from "node:path";
import { Browser } from "playwright";
import type { OboDb } from "@oboapp/db";
import { parseBulgarianMonthDate } from "../shared/date-utils";
import { PostLink } from "./types";
import { extractPostDetails, extractPostLinks } from "./extractors";
import {
  crawlWordpressPage,
  processWordpressPost,
} from "../shared/webpage-crawlers";
import { logger } from "@/lib/logger";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const INDEX_URLS = [
  "https://www.burgas.bg/bg/novini",
  "https://www.burgas.bg/bg/obyavi-i-saobshteniya",
  "https://www.burgas.bg/bg/kulturna-programa",
  "https://www.burgas.bg/bg/sportna-programa",
  "https://www.burgas.bg/bg/programa-na-kulturen-tsentar-morsko-kazino-i-galeriya-georgi-baev",
] as const;
const SOURCE_TYPE = "burgas-org";
const LOCALITY = "bg.burgas";
const DELAY_BETWEEN_REQUESTS = 2000;

function parseBurgasDate(dateText: string): string {
  const cleanedDate = dateText
    .replace(/^[^,]+,\s*/, "")
    .replace(/\s+Публикувано от:.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return parseBulgarianMonthDate(cleanedDate);
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
    parseBurgasDate,
  );

export async function crawl(): Promise<void> {
  for (const indexUrl of INDEX_URLS) {
    await crawlWordpressPage({
      indexUrl,
      sourceType: SOURCE_TYPE,
      extractPostLinks,
      processPost,
      delayBetweenRequests: DELAY_BETWEEN_REQUESTS,
    });
  }
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