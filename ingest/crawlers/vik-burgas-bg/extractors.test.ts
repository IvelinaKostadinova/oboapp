import { describe, it, expect, vi } from "vitest";
import { extractPostLinks, extractPostDetails } from "./extractors";

interface MockPage {
  evaluate: <T>(fn: (...args: any[]) => T, ...args: any[]) => Promise<T>;
}

function createMockPage(mockEvaluate: any): MockPage {
  return { evaluate: mockEvaluate } as MockPage;
}

describe("vik-burgas-bg/extractors", () => {
  describe("extractPostLinks", () => {
    it("extracts a single post link with date", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://vik-burgas.com/news/67-syobshtenie-10",
          title: "Съобщение 10",
          date: "15.01.2025",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toBe("https://vik-burgas.com/news/67-syobshtenie-10");
      expect(posts[0].title).toBe("Съобщение 10");
      expect(posts[0].date).toBe("15.01.2025");
    });

    it("extracts multiple post links", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://vik-burgas.com/news/67-syobshtenie-10",
          title: "Съобщение 10",
          date: "15.01.2025",
        },
        {
          url: "https://vik-burgas.com/news/66-syobshtenie-9",
          title: "Съобщение 9",
          date: "10.01.2025",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(2);
      expect(posts[0].title).toBe("Съобщение 10");
      expect(posts[1].title).toBe("Съобщение 9");
    });

    it("returns empty array when no posts found", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toEqual([]);
    });

    it("passes correct selectors to page.evaluate", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([]);
      const page = createMockPage(mockEvaluate) as any;

      await extractPostLinks(page);

      expect(mockEvaluate).toHaveBeenCalledOnce();
      const [, selectors] = mockEvaluate.mock.calls[0];
      expect(selectors.headingSelector).toBe("h2");
      expect(selectors.linkSelector).toContain("/news/");
    });
  });

  describe("extractPostDetails", () => {
    it("returns title, empty dateText, and contentHtml", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue({
        title: "Съобщение за спиране на водоподаването",
        dateText: "",
        contentHtml: "<p>Уведомяваме ви...</p>",
      });

      const page = createMockPage(mockEvaluate) as any;
      const details = await extractPostDetails(page);

      expect(details.title).toBe("Съобщение за спиране на водоподаването");
      expect(details.dateText).toBe("");
      expect(details.contentHtml).toBe("<p>Уведомяваме ви...</p>");
    });

    it("returns empty strings when selectors match nothing", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue({
        title: "",
        dateText: "",
        contentHtml: "",
      });

      const page = createMockPage(mockEvaluate) as any;
      const details = await extractPostDetails(page);

      expect(details.title).toBe("");
      expect(details.dateText).toBe("");
      expect(details.contentHtml).toBe("");
    });
  });
});
