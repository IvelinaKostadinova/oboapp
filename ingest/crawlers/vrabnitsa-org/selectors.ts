/**
 * CSS selectors for scraping vrabnitsa.sofia.bg (Joomla-based site)
 */
export const SELECTORS = {
  INDEX: {
    POST_CONTAINER: "article.blog-card.so_article",
    POST_LINK: "h3.blog-card__title a",
    POST_TITLE: "h3.blog-card__title",
    POST_DATE: "time",
  },

  POST: {
    CONTENT: "div.article-body",
    TITLE: "h1.article-title",
    DATE: "time",
  },
} as const;