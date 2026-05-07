/**
 * CSS selectors for scraping burgas.bg news announcements.
 *
 * Index page: https://www.burgas.bg/bg/novini
 *   - Articles are in <article class="post"> elements
 *   - Post link: h2.title a (href resolved to absolute by browser via <base> tag)
 *   - Date: <time datetime="2026-04-17 11:02:07"> element
 *
 * Post detail page: https://www.burgas.bg/bg/novini/<slug>
 *   - Title: .block-wrapper.with-bg h1
 *   - Date: .event-meta .float-left (text: "Събота, 18 Април 2026\nПубликувано от: …")
 *   - Content: #content
 */
export const SELECTORS = {
  INDEX: {
    POST_CONTAINER: "article.post",
    POST_LINK: "h2.title a",
    POST_DATE: "time",
    POST_TITLE: "h2.title",
  },

  POST: {
    CONTENT: "#content",
    TITLE: ".block-wrapper.with-bg h1",
    DATE: ".event-meta .float-left",
  },
} as const;
