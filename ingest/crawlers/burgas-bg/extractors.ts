import type { Page } from "playwright";
import type { PostLink } from "./types";
import { SELECTORS } from "./selectors";
import { extractPostDetailsGeneric } from "../shared/extractors";

/**
 * Extract post links from the index page.
 * Uses a custom implementation to read the `datetime` attribute from <time>
 * elements, which gives a clean ISO-like date string directly.
 */
export async function extractPostLinks(page: Page): Promise<PostLink[]> {
  const posts = await page.evaluate(
    ({ containerSelector, linkSelector, dateSelector }) => {
      const result: { url: string; title: string; date: string }[] = [];

      document.querySelectorAll(containerSelector).forEach((container) => {
        const linkEl = container.querySelector(linkSelector);
        if (!linkEl || !(linkEl instanceof HTMLAnchorElement)) return;

        const url = linkEl.href;
        const title = linkEl.textContent?.trim() || "";

        // Prefer the machine-readable datetime attribute over text content.
        const timeEl = container.querySelector(dateSelector);
        const date =
          timeEl?.getAttribute("datetime") ||
          timeEl?.textContent?.trim() ||
          "";

        if (url && title) {
          result.push({ url, title, date });
        }
      });

      return result;
    },
    {
      containerSelector: SELECTORS.INDEX.POST_CONTAINER,
      linkSelector: SELECTORS.INDEX.POST_LINK,
      dateSelector: SELECTORS.INDEX.POST_DATE,
    },
  );

  // Keep only news detail pages (exclude category/navigation links).
  return posts.filter((p) => p.url.includes("/novini/"));
}

/**
 * Extract post details from an individual post page.
 */
export async function extractPostDetails(
  page: Page,
): Promise<{ title: string; dateText: string; contentHtml: string }> {
  return extractPostDetailsGeneric(page, SELECTORS.POST, [
    "script",
    "style",
    "nav",
    "footer",
    ".event-meta",
    ".share-buttons",
    "#fb-root",
  ]);
}
