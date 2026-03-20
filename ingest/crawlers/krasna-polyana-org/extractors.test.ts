import { describe, it, expect, vi } from "vitest";
import { extractPostLinks, extractPostDetails } from "./extractors";

interface MockPage {
  evaluate: <T>(fn: (...args: any[]) => T, ...args: any[]) => Promise<T>;
}

function createMockPage(mockEvaluate: any): MockPage {
  return {
    evaluate: mockEvaluate,
  } as MockPage;
}

describe("krasna-polyana-org/extractors", () => {
  describe("extractPostLinks", () => {
    it("extracts post links from listing", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://krasnapolyana.bg/home/latest-news/340-2026",
          title: "Премахване на аварийни дървета",
          date: "20.03.2026",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toContain("krasnapolyana.bg");
      expect(posts[0].title).toBe("Премахване на аварийни дървета");
      expect(posts[0].date).toBe("20.03.2026");
    });

    it("filters out listing page URL", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://krasnapolyana.bg/home/latest-news",
          title: "Latest news",
          date: "",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(0);
    });

    it("filters out category links", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://krasnapolyana.bg/category/%d0%bd%d0%be%d0%b2%d0%b8%d0%bd%d0%b8/",
          title: "Категория",
          date: "",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(0);
    });
  });

  describe("extractPostDetails", () => {
    it("extracts details from post page", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue({
        title: "Планирани ремонтни дейности",
        dateText: "20.03.2026",
        contentHtml: "<p>Текст на публикацията</p>",
      });

      const page = createMockPage(mockEvaluate) as any;
      const details = await extractPostDetails(page);

      expect(details.title).toBe("Планирани ремонтни дейности");
      expect(details.dateText).toBe("20.03.2026");
      expect(details.contentHtml).toContain("Текст на публикацията");
    });
  });
});
