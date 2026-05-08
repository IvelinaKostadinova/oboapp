export const SELECTORS = {
  INDEX: {
    POST_CONTAINER: "#content > article.post",
    POST_LINK: ".post-body h2.title a, .post-body h3.h4 a",
    POST_TITLE: ".post-body h2.title, .post-body h3.h4",
    POST_DATE: ".post-meta time",
  },
  POST: {
    TITLE: "main .block-wrapper.with-bg h1",
    DATE: "#content .event-meta span.float-left",
    CONTENT: "#content",
  },
} as const;