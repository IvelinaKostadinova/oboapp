import { describe, it, expect, vi } from "vitest";
import { extractPostLinks, extractPostDetails } from "./extractors";
import { SELECTORS } from "./selectors";

interface MockPage {
  evaluate: <T>(fn: (...args: any[]) => T, ...args: any[]) => Promise<T>;
}

function createMockPage(mockEvaluate: MockPage["evaluate"]): MockPage {
  return {
    evaluate: mockEvaluate,
  };
}

describe("vrabnitsa-org/extractors", () => {
  describe("extractPostLinks", () => {
    it("should extract news post links from Joomla blog cards", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://vrabnitsa.sofia.bg/aktualno/news/preimenuvane-na-ulitsi-v-kv-obelya",
          title: "Преименуване на улици в кв. Обеля",
          date: "12 март 2026",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toContain("/aktualno/news/");
      expect(posts[0].title).toBe("Преименуване на улици в кв. Обеля");
      expect(posts[0].date).toBe("12 март 2026");
    });

    it("should filter out non-article URLs", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://vrabnitsa.sofia.bg/aktualno/news/test-post",
          title: "Valid Post",
          date: "20 март 2026",
        },
        {
          url: "https://vrabnitsa.sofia.bg/aktualno/news/page/2",
          title: "Invalid Pagination Link",
          date: "20 март 2026",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toBe(
        "https://vrabnitsa.sofia.bg/aktualno/news/test-post",
      );
    });

    it("should return empty array when no posts are found", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toEqual([]);
    });
  });

  describe("extractPostDetails", () => {
    it("should extract article details from Joomla article pages", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue({
        title: "Преименуване на улици в кв. Обеля",
        dateText: "2026-03-12T10:22:16+02:00",
        contentHtml:
          "<p>Публикувано е решението на СОС за преименуване на улици.</p>",
      });

      const page = createMockPage(mockEvaluate) as any;
      const details = await extractPostDetails(page);

      expect(details.title).toBe("Преименуване на улици в кв. Обеля");
      expect(details.dateText).toBe("2026-03-12T10:22:16+02:00");
      expect(details.contentHtml).toContain("решението на СОС");
    });

    it("should use the expected selectors", () => {
      expect(SELECTORS.INDEX.POST_CONTAINER).toBe(
        "article.blog-card.so_article",
      );
      expect(SELECTORS.POST.TITLE).toBe("h1.article-title");
      expect(SELECTORS.POST.DATE).toBe("time");
      expect(SELECTORS.POST.CONTENT).toBe("div.article-body");
    });
  });
});