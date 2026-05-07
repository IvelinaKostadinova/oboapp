import { describe, it, expect, vi } from "vitest";
import { extractPostLinks, extractPostDetails } from "./extractors";

interface MockPage {
  evaluate: <T>(fn: (...args: unknown[]) => T, ...args: unknown[]) => Promise<T>;
}

function createMockPage(mockEvaluate: ReturnType<typeof vi.fn>): MockPage {
  return { evaluate: mockEvaluate } as unknown as MockPage;
}

describe("burgas-bg/extractors", () => {
  describe("extractPostLinks", () => {
    it("extracts post links with datetime attribute dates", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://www.burgas.bg/bg/novini/remontat-na-bul-ivan-vazov",
          title: "Ремонтът на бул. \"Иван Вазов\"",
          date: "2026-04-18 14:02:00",
        },
        {
          url: "https://www.burgas.bg/bg/novini/izvozvane-na-chlenove",
          title: "Извозване на членове",
          date: "2026-04-19 18:50:27",
        },
      ]);

      const page = createMockPage(mockEvaluate) as unknown as Parameters<
        typeof extractPostLinks
      >[0];
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(2);
      expect(posts[0].title).toBe("Ремонтът на бул. \"Иван Вазов\"");
      expect(posts[0].date).toBe("2026-04-18 14:02:00");
      expect(posts[1].url).toContain("/novini/");
    });

    it("filters out non-news URLs", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://www.burgas.bg/bg/novini/valid-news",
          title: "Новина",
          date: "2026-04-18 10:00:00",
        },
        {
          url: "https://www.burgas.bg/bg/category/events",
          title: "Събития",
          date: "",
        },
      ]);

      const page = createMockPage(mockEvaluate) as unknown as Parameters<
        typeof extractPostLinks
      >[0];
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toContain("/novini/");
    });

    it("returns empty array when no posts found", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([]);

      const page = createMockPage(mockEvaluate) as unknown as Parameters<
        typeof extractPostLinks
      >[0];
      const posts = await extractPostLinks(page);

      expect(posts).toEqual([]);
    });
  });

  describe("extractPostDetails", () => {
    it("extracts title, date, and content", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue({
        title: "Ремонтът на бул. Иван Вазов ще продължи",
        dateText: "Събота, 18 Април 2026",
        contentHtml: "<p>Текст на съобщението</p>",
      });

      const page = createMockPage(mockEvaluate) as unknown as Parameters<
        typeof extractPostDetails
      >[0];
      const details = await extractPostDetails(page);

      expect(details.title).toContain("Иван Вазов");
      expect(details.dateText).toBe("Събота, 18 Април 2026");
      expect(details.contentHtml).toContain("Текст на съобщението");
    });
  });
});
