import { describe, it, expect, vi, afterEach } from "vitest";
import { parseBurgasDate } from "./index";
import { logger } from "@/lib/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("burgas-bg/parseBurgasDate", () => {
  describe("shape 1: detail-page text", () => {
    it("parses full Bulgarian month date", () => {
      const result = new Date(parseBurgasDate("Събота, 18 Април 2026"));
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(18);
    });

    it("parses date with 'Публикувано от' suffix", () => {
      const result = new Date(
        parseBurgasDate(
          "Събота, 18 Април 2026\nПубликувано от: Женя Петкова",
        ),
      );
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(18);
    });

    it("parses date without weekday prefix", () => {
      const result = new Date(parseBurgasDate("17 Април 2026"));
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(17);
    });

    it("handles all months", () => {
      const cases: [string, number, number][] = [
        ["1 Януари 2026", 0, 1],
        ["28 Февруари 2026", 1, 28],
        ["31 Март 2026", 2, 31],
        ["1 Май 2026", 4, 1],
        ["30 Юни 2026", 5, 30],
        ["15 Юли 2026", 6, 15],
        ["1 Август 2026", 7, 1],
        ["1 Септември 2026", 8, 1],
        ["1 Октомври 2026", 9, 1],
        ["1 Ноември 2026", 10, 1],
        ["31 Декември 2026", 11, 31],
      ];
      for (const [input, expectedMonth, expectedDay] of cases) {
        const result = new Date(parseBurgasDate(input));
        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(expectedMonth);
        expect(result.getDate()).toBe(expectedDay);
      }
    });
  });

  describe("shape 2: ISO-like fallback from <time datetime>", () => {
    it("uses fallback when dateText is empty", () => {
      const result = new Date(parseBurgasDate("", "2026-04-17 11:02:07"));
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(17);
      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(2);
    });

    it("uses fallback when dateText has no recognisable date", () => {
      const result = new Date(
        parseBurgasDate("Публикувано от: Автор", "2026-03-05 09:30:00"),
      );
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(2); // March
      expect(result.getDate()).toBe(5);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(30);
    });

    it("prefers shape-1 match over fallback", () => {
      const result = new Date(
        parseBurgasDate("18 Април 2026", "2026-01-01 00:00:00"),
      );
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(18);
    });
  });

  describe("fallback to current date on invalid input", () => {
    it("returns current date and warns when both inputs are unparseable", () => {
      const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
      const before = Date.now();
      const result = parseBurgasDate("не е дата", "не е дата");
      const after = Date.now();

      const ts = new Date(result).getTime();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
      expect(warnSpy).toHaveBeenCalledOnce();

      warnSpy.mockRestore();
    });
  });
});
