/**
 * CSS selectors for scraping vik-burgas.com
 */
export const SELECTORS = {
  // Index page selectors (used for custom extraction in extractors.ts)
  INDEX: {
    // h2 headings that contain links to news articles
    POST_HEADING: "h2",
    // Link pattern for news articles
    POST_LINK: 'a[href*="/news/"]',
  },

  // Individual post page selectors
  POST: {
    // Main content area — detail pages render content inside #main
    CONTENT: "#main",
    // Title
    TITLE: "h1",
    // Date — not present on detail pages; injected from listing page in index.ts
    DATE: ":not(*)",
  },
} as const;
