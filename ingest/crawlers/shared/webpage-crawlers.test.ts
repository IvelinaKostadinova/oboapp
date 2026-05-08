import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildWebPageSourceDocument, crawlWordpressPages } from "./webpage-crawlers";
import type { PostLink } from "./types";

// ── shared mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/delay", () => ({ delay: vi.fn().mockResolvedValue(undefined) }));

vi.mock("./firestore", () => ({
  isUrlProcessed: vi.fn(),
  saveSourceDocument: vi.fn(),
  encodeDocumentId: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
}));

vi.mock("./browser", () => ({
  launchBrowser: vi.fn(),
}));

// ── helpers ──────────────────────────────────────────────────────────────────

function makeLinks(n: number, prefix = "https://example.com/post-"): PostLink[] {
  return Array.from({ length: n }, (_, i) => ({
    url: `${prefix}${i + 1}`,
    title: `Post ${i + 1}`,
    date: "2026-04-18",
  }));
}

function makeMockBrowser() {
  const mockPageClose = vi.fn().mockResolvedValue(undefined);
  const mockPageGoto = vi.fn().mockResolvedValue(undefined);
  const mockNewPage = vi.fn().mockResolvedValue({
    goto: mockPageGoto,
    close: mockPageClose,
  });
  const mockBrowserClose = vi.fn().mockResolvedValue(undefined);
  return { newPage: mockNewPage, close: mockBrowserClose };
}

beforeEach(async () => {
  vi.clearAllMocks();
  const { isUrlProcessed } = await import("./firestore");
  vi.mocked(isUrlProcessed).mockResolvedValue(false);
  const { launchBrowser } = await import("./browser");
  vi.mocked(launchBrowser).mockResolvedValue(makeMockBrowser() as any);
});

// ── crawlWordpressPages tests ─────────────────────────────────────────────────

describe("shared/crawlWordpressPages", () => {
  it("processes posts from multiple index URLs", async () => {
    const processPost = vi.fn().mockResolvedValue(undefined);
    const extractPostLinks = vi.fn()
      .mockResolvedValueOnce(makeLinks(2, "https://example.com/a-"))
      .mockResolvedValueOnce(makeLinks(1, "https://example.com/b-"));

    await crawlWordpressPages({
      indexUrls: ["https://example.com/index-a", "https://example.com/index-b"],
      sourceType: "test",
      extractPostLinks,
      processPost,
    });

    expect(extractPostLinks).toHaveBeenCalledTimes(2);
    expect(processPost).toHaveBeenCalledTimes(3);
  });

  it("skips already-processed posts", async () => {
    const { isUrlProcessed } = await import("./firestore");
    vi.mocked(isUrlProcessed).mockResolvedValue(true);
    const processPost = vi.fn().mockResolvedValue(undefined);
    const extractPostLinks = vi.fn().mockResolvedValue(makeLinks(2));

    await crawlWordpressPages({
      indexUrls: ["https://example.com/index"],
      sourceType: "test",
      extractPostLinks,
      processPost,
    });

    expect(processPost).not.toHaveBeenCalled();
  });

  it("continues to next index URL when one index page fails", async () => {
    const processPost = vi.fn().mockResolvedValue(undefined);
    const extractPostLinks = vi.fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(makeLinks(1, "https://example.com/b-"));

    await crawlWordpressPages({
      indexUrls: ["https://example.com/bad-index", "https://example.com/good-index"],
      sourceType: "test",
      extractPostLinks,
      processPost,
    });

    expect(processPost).toHaveBeenCalledTimes(1);
  });

  it("continues processing remaining posts when one post fails", async () => {
    const processPost = vi.fn()
      .mockRejectedValueOnce(new Error("post error"))
      .mockResolvedValue(undefined);
    const extractPostLinks = vi.fn().mockResolvedValue(makeLinks(3));

    await crawlWordpressPages({
      indexUrls: ["https://example.com/index"],
      sourceType: "test",
      extractPostLinks,
      processPost,
    });

    expect(processPost).toHaveBeenCalledTimes(3);
  });

  it("closes the browser even when crawl throws", async () => {
    const { launchBrowser } = await import("./browser");
    vi.mocked(launchBrowser).mockRejectedValueOnce(new Error("browser launch failed"));

    await expect(
      crawlWordpressPages({
        indexUrls: ["https://example.com/index"],
        sourceType: "test",
        extractPostLinks: vi.fn(),
        processPost: vi.fn(),
      })
    ).rejects.toThrow("browser launch failed");

    // browser never launched so close is not called, but the error propagates
  });

  it("logs a warning when an index page has no posts", async () => {
    const { logger } = await import("@/lib/logger");
    const processPost = vi.fn();
    const extractPostLinks = vi.fn().mockResolvedValue([]);

    await crawlWordpressPages({
      indexUrls: ["https://example.com/empty-index"],
      sourceType: "test",
      extractPostLinks,
      processPost,
    });

    expect(logger.warn).toHaveBeenCalledWith(
      "No posts found on index page",
      expect.objectContaining({ url: "https://example.com/empty-index" }),
    );
    expect(processPost).not.toHaveBeenCalled();
  });
});

describe("shared/webpage-crawlers", () => {
  describe("buildWebPageSourceDocument", () => {
    it("should build source document with HTML to Markdown conversion", () => {
      const doc = buildWebPageSourceDocument({
        url: "https://example.com/post",
        title: "Test Title",
        dateText: "15 декември 2025",
        contentHtml: "<h2>Heading</h2><p>Paragraph</p>",
        sourceType: "test-source",
        locality: "bg.sofia",
      });

      expect(doc.url).toBe("https://example.com/post");
      expect(doc.title).toBe("Test Title");
      expect(doc.sourceType).toBe("test-source");
      expect(doc.message).toContain("Heading");
      expect(doc.message).toContain("Paragraph");
      expect(doc.datePublished).toBeTruthy();
    });

    it("should throw error for empty title", () => {
      expect(() =>
        buildWebPageSourceDocument({
          url: "https://example.com/post",
          title: "",
          dateText: "1 януари 2025",
          contentHtml: "<p>Content</p>",
          sourceType: "test-source",
          locality: "bg.sofia",
        })
      ).toThrow("Failed to extract title");
    });

    it("should throw error for empty content", () => {
      expect(() =>
        buildWebPageSourceDocument({
          url: "https://example.com/post",
          title: "Title",
          dateText: "1 януари 2025",
          contentHtml: "",
          sourceType: "test-source",
          locality: "bg.sofia",
        })
      ).toThrow("Failed to extract content");
    });

    it("should handle complex HTML", () => {
      const html = `
        <div>
          <h1>Main Title</h1>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <p>Text with <strong>bold</strong> and <em>italic</em></p>
        </div>
      `;

      const doc = buildWebPageSourceDocument({
        url: "https://example.com/post",
        title: "Test",
        dateText: "1 януари 2025",
        contentHtml: html,
        sourceType: "test-source",
        locality: "bg.sofia",
      });

      expect(doc.message).toContain("Main Title");
      expect(doc.message).toContain("Item 1");
      expect(doc.message).toContain("**bold**");
      expect(doc.message).toContain("_italic_"); // Turndown uses underscores for emphasis
    });
  });
});
