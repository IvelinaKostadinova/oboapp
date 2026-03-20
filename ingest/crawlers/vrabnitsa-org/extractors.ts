import type { Page } from "playwright";
import type { PostLink } from "./types";
import { SELECTORS } from "./selectors";
import { extractPostLinks as extractPostLinksShared } from "../shared/extractors";

export async function extractPostLinks(page: Page): Promise<PostLink[]> {
  const urlFilter = (url: string) => {
    let decodedUrl: string;
    try {
      decodedUrl = decodeURIComponent(url).toLowerCase();
    } catch {
      decodedUrl = url.toLowerCase();
    }

    return (
      decodedUrl.includes("/aktualno/news/") &&
      !decodedUrl.includes("/page/") &&
      !decodedUrl.includes("#")
    );
  };

  return extractPostLinksShared(page, SELECTORS, urlFilter);
}

export async function extractPostDetails(
  page: Page,
): Promise<{ title: string; dateText: string; contentHtml: string }> {
  return page.evaluate((selectors) => {
    const titleEl = document.querySelector(selectors.POST.TITLE);
    const title = titleEl?.textContent?.trim() || "";

    const dateEl = document.querySelector(selectors.POST.DATE);
    const dateText =
      dateEl?.getAttribute("datetime")?.trim() ||
      dateEl?.textContent?.replace(/\s+/g, " ").trim() ||
      "";

    const contentEl = document.querySelector(selectors.POST.CONTENT);
    let contentHtml = "";

    if (contentEl) {
      const clone = contentEl.cloneNode(true);
      if (!(clone instanceof HTMLElement)) {
        return { title, dateText, contentHtml };
      }

      clone
        .querySelectorAll(
          "script, style, .article-aside, .pager, .icons, .btn-group, .navigation",
        )
        .forEach((element) => element.remove());

      contentHtml = clone.innerHTML;
    }

    return { title, dateText, contentHtml };
  }, SELECTORS);
}