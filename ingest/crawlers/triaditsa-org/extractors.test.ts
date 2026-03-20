import { describe, it, expect, vi } from "vitest";
import {
  extractPostLinks,
  extractPostDetails,
  extractDateFromJsonLdScripts,
} from "./extractors";

interface MockPage {
  evaluate: <T>(fn: (...args: any[]) => T, ...args: any[]) => Promise<T>;
}

function createMockPage(mockEvaluate: any): MockPage {
  return {
    evaluate: mockEvaluate,
  } as MockPage;
}

describe("triaditsa-org/extractors", () => {
  describe("extractDateFromJsonLdScripts", () => {
    it("extracts datePublished from JSON-LD graph", () => {
      const scripts = [
        JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              datePublished: "2026-03-12T10:31:30+00:00",
            },
          ],
        }),
      ];

      const result = extractDateFromJsonLdScripts(scripts);
      expect(result).toBe("2026-03-12T10:31:30+00:00");
    });

    it("extracts datePublished from top-level JSON-LD arrays", () => {
      const scripts = [
        JSON.stringify([
          {
            "@type": "BreadcrumbList",
          },
          {
            "@type": "NewsArticle",
            datePublished: "2026-03-13T09:15:00+00:00",
          },
        ]),
      ];

      const result = extractDateFromJsonLdScripts(scripts);
      expect(result).toBe("2026-03-13T09:15:00+00:00");
    });

    it("returns undefined for invalid JSON-LD content", () => {
      const result = extractDateFromJsonLdScripts(["not-json"]);
      expect(result).toBeUndefined();
    });
  });

  describe("extractPostLinks", () => {
    it("extracts post links from listing", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://triaditza.org/%d1%80%d0%b5%d0%bc%d0%be%d0%bd%d1%82-%d0%bd%d0%b0-%d1%83%d0%bb%d0%b8%d1%86%d0%b0/",
          title: "Ремонт на улица",
          date: "17.03.2026",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toContain("triaditza.org");
      expect(posts[0].title).toBe("Ремонт на улица");
      expect(posts[0].date).toBe("17.03.2026");
    });

    it("filters out category links", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://triaditza.org/category/%d0%bd%d0%be%d0%b2%d0%b8%d0%bd%d0%b8/",
          title: "Категория",
          date: "",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);
      expect(posts).toHaveLength(0);
    });

    it("filters out tag and pagination links", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://triaditza.org/tag/traffic/",
          title: "Tag",
          date: "",
        },
        {
          url: "https://triaditza.org/page/2/",
          title: "Page 2",
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
        title: "Временна организация на движението",
        dateCandidates: ["17.03.2026"],
        structuredDataScripts: [],
        contentHtml: "<p>Съдържание на публикацията</p>",
      });

      const page = createMockPage(mockEvaluate) as any;
      const details = await extractPostDetails(page);

      expect(details.title).toBe("Временна организация на движението");
      expect(details.dateText).toBe("17.03.2026");
      expect(details.contentHtml).toContain("Съдържание");
    });

    it("prefers JSON-LD date when available", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue({
        title: "Тест",
        dateCandidates: ["17.03.2026"],
        structuredDataScripts: [
          JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                datePublished: "2026-03-12T10:31:30+00:00",
              },
            ],
          }),
        ],
        contentHtml: "<p>Текст</p>",
      });

      const page = createMockPage(mockEvaluate) as any;
      const details = await extractPostDetails(page);

      expect(details.dateText).toBe("2026-03-12T10:31:30+00:00");
    });
  });
});
