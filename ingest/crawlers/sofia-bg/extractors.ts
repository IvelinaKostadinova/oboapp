import type { Page } from "playwright";
import type { PostLink } from "./types";
import { SELECTORS } from "./selectors";
import { extractPostDetailsGeneric } from "../shared/extractors";

const FEED_FETCH_TIMEOUT_MS = 30_000;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

/**
 * Fetch the RSS feed XML for the sofia.bg repairs page.
 */
export async function fetchFeedXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FEED_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; oboapp-crawler/1.0)" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`RSS feed returned ${response.status} for ${url}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse RSS feed XML into a list of post links.
 * Each <item> must have <title>, <link>, and <dc:date> (ISO 8601).
 * Items missing any required field are skipped.
 */
export function parseFeedItems(xml: string): PostLink[] {
  const postLinks: PostLink[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const itemXml = m[1];

    const title = decodeHtmlEntities(
      itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "",
    );
    const url = decodeHtmlEntities(
      itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "",
    );
    const date =
      itemXml.match(/<dc:date>([\s\S]*?)<\/dc:date>/)?.[1]?.trim() ?? "";

    if (!title || !url || !date) continue;

    postLinks.push({ url, title, date });
  }

  return postLinks;
}

/**
 * Extract post details from an individual post page.
 * Date is not extracted from the page — it comes from the RSS feed.
 */
export async function extractPostDetails(
  page: Page,
): Promise<{ title: string; dateText: string; contentHtml: string }> {
  return extractPostDetailsGeneric(page, SELECTORS.POST, [
    "script",
    "style",
    "nav",
    "header",
    "footer",
    ".share-buttons",
    ".social-share",
    ".navigation",
  ]);
}
