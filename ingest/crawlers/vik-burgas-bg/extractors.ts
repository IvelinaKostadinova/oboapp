import type { Page } from "playwright";
import type { PostLink } from "./types";
import { SELECTORS } from "./selectors";
import { extractPostDetailsGeneric } from "../shared/extractors";
import { logger } from "@/lib/logger";

/**
 * Extract post links from the news index page.
 *
 * vik-burgas.com uses a flat layout: each article is an h2 heading containing a
 * link, followed by sibling elements that include the publication date in the
 * format "Публикуване: DD.MM.YYYY". There is no wrapping container per article,
 * so the generic extractPostLinks helper cannot be used here.
 */
export async function extractPostLinks(page: Page): Promise<PostLink[]> {
  logger.debug("Extracting post links from index page");

  const posts = await page.evaluate(
    ({ headingSelector, linkSelector }) => {
      const items: { url: string; title: string; date: string }[] = [];

      const headings = Array.from(
        document.querySelectorAll<HTMLHeadingElement>(headingSelector),
      );

      for (const h2 of headings) {
        const link = h2.querySelector<HTMLAnchorElement>(linkSelector);
        if (!link) continue;

        const url = link.href;
        const title = link.textContent?.trim() ?? "";
        if (!url || !title) continue;

        // News article URLs match /news/<id>-<slug>
        if (!/\/news\/\d/.test(new URL(url).pathname)) continue;

        // Walk following siblings until the next h2 to find the date
        let date = "";
        let sibling = h2.nextElementSibling;
        while (sibling && sibling.tagName !== "H2") {
          const text = sibling.textContent?.trim() ?? "";
          if (text.includes("Публикуване:")) {
            date = text.replace(/^.*Публикуване:\s*/, "").trim();
            break;
          }
          sibling = sibling.nextElementSibling;
        }

        items.push({ url, title, date });
      }

      return items;
    },
    {
      headingSelector: SELECTORS.INDEX.POST_HEADING,
      linkSelector: SELECTORS.INDEX.POST_LINK,
    },
  );

  logger.debug("Found posts on index page", { count: posts.length });
  return posts;
}

/**
 * Extract post details from an individual news article page.
 *
 * Note: vik-burgas.com detail pages do not display the publication date.
 * The date is injected from the listing page in index.ts.
 */
export async function extractPostDetails(
  page: Page,
): Promise<{ title: string; dateText: string; contentHtml: string }> {
  return extractPostDetailsGeneric(page, SELECTORS.POST, [
    "script",
    "style",
    "nav",
    ".moduletable",
    ".mod-breadcrumbs",
    "#bottom",
  ]);
}
