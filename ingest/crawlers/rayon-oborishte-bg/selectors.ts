/**
 * CSS selectors for scraping rayon-oborishte.bg
 */
export const SELECTORS = {
  // Index page selectors
  INDEX: {
    // Each post card/article on the listing page
    POST_CONTAINER: 'article, .post, [class*="post"]',
    // Link to individual post
    POST_LINK: 'a[href*="rayon-oborishte.bg"]',
    // Date on listing
    POST_DATE: 'time, .date, [class*="date"]',
    // Title on listing
    POST_TITLE: 'h2, h3, .title, [class*="title"]',
  },

  // Individual post page selectors
  POST: {
    // Main content area
    CONTENT: "article, .entry-content, .post-content, main",
    // Title
    TITLE: "h1, .entry-title, .post-title",
    // Date
    DATE: 'time, .date, .published, [class*="date"]',
    // Main message body
    MESSAGE: ".entry-content, .post-content, article p",
  },
} as const;
