import { describe, expect, it, vi } from "vitest";
import { extractPostDetails, extractPostLinks } from "./extractors";

interface MockPage {
  evaluate: <T>(fn: (...args: any[]) => T, ...args: any[]) => Promise<T>;
}

function createMockPage(mockEvaluate: MockPage["evaluate"]): MockPage {
  return {
    evaluate: mockEvaluate,
  };
}

describe("burgas-org/extractors", () => {
  describe("extractPostLinks", () => {
    it("filters the listing to disruption-related posts", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://www.burgas.bg/bg/novini/remontat-na-bul-ivan-vazov-shte-prodalzhi-i-na-20-april",
          title: "Ремонтът на бул. Иван Вазов ще продължи и на 21 април",
          date: "Събота, 18 Април 2026",
        },
        {
          url: "https://www.burgas.bg/bg/novini/izlozhba-otbelyaza-50-godini-ot-sazdavaneto-na-su-konstantin-preslavski",
          title: 'Изложба отбеляза 50 години от създаването на СУ "Константин Преславски"',
          date: "Събота, 18 Април 2026",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(1);
      expect(posts[0].title).toContain("Ремонтът");
    });

    it("keeps non-repair transport disruptions when keywords match", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://www.burgas.bg/bg/novini/izvozvane-na-chlenovete-na-sektsionnite-izbiratelni-komisii-v-izbornata-nosht",
          title: "Извозване на членовете на Секционните избирателни комисии в изборната нощ",
          date: "Неделя, 19 Април 2026",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toContain("izvozvane");
    });

    it("keeps relevant posts from non-news Burgas sections", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://www.burgas.bg/bg/obyavi-i-saobshteniya/remont-na-ulitsa-v-tsentralna-gradska-chast",
          title: "Ремонт на улица в централна градска част",
          date: "Понеделник, 20 Април 2026",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toContain("obyavi-i-saobshteniya");
    });

    it("excludes keyword-matching posts from non-allowlisted sections", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://www.burgas.bg/bg/kultura/remont-na-ulitsa-v-tsentralna-gradska-chast",
          title: "Ремонт на улица в централна градска част",
          date: "Понеделник, 20 Април 2026",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toEqual([]);
    });

    it("includes construction-section posts whose permalinks fall under /bg/novini/", async () => {
      // Posts on the /bg/novini-stroitelstvo index are permalinked under /bg/novini/,
      // not /bg/novini-stroitelstvo/. This test asserts they pass the allowlist filter.
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://www.burgas.bg/bg/novini/remontat-pred-zhp-garata-prodalzhava-i-utre",
          title: "Ремонтът пред ЖП гарата продължава и утре",
          date: "Четвъртък, 01 Май 2026",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toHaveLength(1);
      expect(posts[0].url).toContain("/bg/novini/");
    });

    it("returns an empty list when no relevant posts are found", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue([
        {
          url: "https://www.burgas.bg/bg/novini/otkrivame-izlozhenieto-flora-s-revyu-na-toaleti-tsvetya-muzikalna-programa-i-tematichni-instalatsii-ot-rasteniya",
          title: "Откриваме изложението Флора",
          date: "Петък, 17 Април 2026",
        },
      ]);

      const page = createMockPage(mockEvaluate) as any;
      const posts = await extractPostLinks(page);

      expect(posts).toEqual([]);
    });
  });

  describe("extractPostDetails", () => {
    it("returns extracted detail fields", async () => {
      const mockEvaluate = vi.fn().mockResolvedValue({
        title: "Ремонтът на бул. Иван Вазов ще продължи и на 21 април",
        dateText: "Събота, 18 Април 2026",
        contentHtml: "<p>Бул. Иван Вазов ще бъде затворен за движение.</p>",
      });

      const page = createMockPage(mockEvaluate) as any;
      const details = await extractPostDetails(page);

      expect(details.title).toContain("Иван Вазов");
      expect(details.dateText).toBe("Събота, 18 Април 2026");
      expect(details.contentHtml).toContain("затворен за движение");
    });
  });
});