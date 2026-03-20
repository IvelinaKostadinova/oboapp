/**
 * CSS selectors for scraping krasnapolyana.bg
 */
export const SELECTORS = {
  INDEX: {
    POST_CONTAINER: ".items-leading > div, .items-row > div, .item, .blog-item",
    POST_LINK: 'a[href*="/home/latest-news/"]',
    POST_DATE: '.published, .create, time, [class*="date"]',
    POST_TITLE: "h2, h3, .page-header, .item-title",
  },

  POST: {
    CONTENT: ".item-page, .itemBody, .entry-content, article, main",
    TITLE: "h1, h2, .item-title, .page-header",
    DATE: '.published, .create, time, [class*="date"]',
  },
} as const;
