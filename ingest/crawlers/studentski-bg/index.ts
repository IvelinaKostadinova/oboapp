#!/usr/bin/env node

import dotenv from "dotenv";
import { resolve } from "node:path";
import { Browser } from "playwright";
import type { Firestore } from "firebase-admin/firestore";
import { PostLink } from "./types";
import { extractPostLinks, extractPostDetails } from "./extractors";
import {
  buildWebPageSourceDocument,
  crawlWordpressPage,
  processWordpressPost,
} from "../shared/webpage-crawlers";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const INDEX_URL =
  "https://studentski.bg/category/%d0%b3%d1%80%d0%b0%d1%84%d0%b8%d1%86%d0%b8/";
const SOURCE_TYPE = "studentski-bg";
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

/**
 * Main crawler function for studentski.bg
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

/**
 * Process a single post
 */
const processPost = (
  browser: Browser,
  postLink: PostLink,
  adminDb: Firestore
) =>
  processWordpressPost(
    browser,
    postLink,
    adminDb,
    SOURCE_TYPE,
    DELAY_BETWEEN_REQUESTS,
    extractPostDetails,
    (url, _postLink, details) =>
      buildWebPageSourceDocument(
        url,
        details.title,
        details.dateText,
        details.contentHtml,
        SOURCE_TYPE
      )
  );

if (require.main === module) {
  crawl().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
