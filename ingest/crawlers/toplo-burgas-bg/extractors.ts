import { FEED_URL, TEXT_WIDGET_DATA_ID } from "./selectors";
import type { FeedItem } from "./types";

const FEED_FETCH_TIMEOUT_MS = 30_000;

/** Decode numeric and common named HTML/XML entities in a string. */
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, "\u00a0");
}

/**
 * Fetch the RSS feed XML from Топлофикация Бургас.
 */
export async function fetchFeedXml(): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FEED_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(FEED_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        // Site returns 403 without a browser-like User-Agent
        "User-Agent":
          "Mozilla/5.0 (compatible; oboapp-crawler/1.0; +https://obo.app)",
      },
    });

    if (!response.ok) {
      throw new Error(`Feed returned HTTP ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse RSS `<item>` blocks from the feed XML into structured FeedItems.
 */
export function parseFeedItems(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const itemXml = m[1];

    // Titles use plain text with HTML entities (not CDATA) on this site
    const titleRaw =
      itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      itemXml.match(/<title>([^<]*)<\/title>/)?.[1] ??
      "";
    const title = decodeXmlEntities(titleRaw.trim());
    // WordPress RSS: <link> contains plain text URL (not CDATA, not an attribute)
    const url =
      itemXml.match(/<link>(https?:\/\/[^<]+)<\/link>/)?.[1]?.trim() ?? "";
    const pubDate =
      itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const contentEncodedHtml =
      itemXml.match(
        /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/,
      )?.[1] ?? "";

    if (!url) continue;

    items.push({ url, title, pubDate, contentEncodedHtml });
  }

  return items;
}

/**
 * Extract the main post body HTML from the `<content:encoded>` Elementor HTML.
 *
 * All posts on this site use the same template: the article text lives in
 * an `elementor-widget-text-editor` widget with `data-id="e446927"`,
 * inside a single `<div class="elementor-widget-container">`.
 */
export function extractContentHtml(contentEncoded: string): string {
  const widgetPos = contentEncoded.indexOf(`data-id="${TEXT_WIDGET_DATA_ID}"`);
  if (widgetPos === -1) return "";

  const containerTag = '<div class="elementor-widget-container">';
  const containerStart = contentEncoded.indexOf(containerTag, widgetPos);
  if (containerStart === -1) return "";

  const contentStart = containerStart + containerTag.length;

  // Walk forward counting <div> depth to find the matching </div>
  let depth = 1;
  let pos = contentStart;

  while (depth > 0 && pos < contentEncoded.length) {
    const nextOpen = contentEncoded.indexOf("<div", pos);
    const nextClose = contentEncoded.indexOf("</div>", pos);

    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return contentEncoded.slice(contentStart, nextClose).trim();
      }
      pos = nextClose + 6;
    }
  }

  return "";
}

/**
 * Convert an RFC 2822 `<pubDate>` string (from RSS) to ISO 8601.
 * e.g. "Thu, 23 Apr 2026 07:09:42 +0000" → "2026-04-23T07:09:42.000Z"
 */
export function parseFeedDate(pubDate: string): string {
  const parsedDate = new Date(pubDate);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid RSS pubDate: ${JSON.stringify(pubDate)}`);
  }
  return parsedDate.toISOString();
}
