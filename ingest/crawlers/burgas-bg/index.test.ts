import { describe, it, expect, vi, afterEach } from "vitest";
import { parseBurgasDate } from "./index";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("burgas-bg/parseBurgasDate", () => {
  describe("shape 1: detail-page text", () => {
    it("parses full Bulgarian month date", () => {
      const result = parseBurgasDate("Събота, 18 Април 2026");
      expect(result).toBe(new Date("2026-04-18T00:00:00+02:00").toISOString());
    });

    it("parses date with 'Публикувано от' suffix", () => {
      const result = parseBurgasDate(
        "Събота, 18 Април 2026\nПубликувано от: Женя Петкова",
      );
      expect(result).toBe(new Date("2026-04-18T00:00:00+02:00").toISOString());
    });

    it("parses date without weekday prefix", () => {
      const result = parseBurgasDate("17 Април 2026");
      expect(result).toBe(new Date("2026-04-17T00:00:00+02:00").toISOString());
    });

    it("handles all months", () => {
      const cases: [string, string][] = [
        ["1 Януари 2026", "2026-01-01"],
        ["28 Февруари 2026", "2026-02-28"],
        ["31 Март 2026", "2026-03-31"],
        ["1 Май 2026", "2026-05-01"],
        ["30 Юни 2026", "2026-06-30"],
        ["15 Юли 2026", "2026-07-15"],
        ["1 Август 2026", "2026-08-01"],
        ["1 Септември 2026", "2026-09-01"],
        ["1 Октомври 2026", "2026-10-01"],
        ["1 Ноември 2026", "2026-11-01"],
        ["31 Декември 2026", "2026-12-31"],
      ];
      for (const [input, expectedDate] of cases) {
        const result = parseBurgasDate(input);
        expect(result).toBe(
          new Date(`${expectedDate}T00:00:00+02:00`).toISOString(),
        );
      }
    });
  });

  describe("shape 2: ISO-like fallback from <time datetime>", () => {
    it("uses fallback when dateText is empty", () => {
      const result = parseBurgasDate("", "2026-04-17 11:02:07");
      expect(result).toBe(new Date("2026-04-17T11:02:07+02:00").toISOString());
    });

    it("uses fallback when dateText has no recognisable date", () => {
      const result = parseBurgasDate("Публикувано от: Автор", "2026-03-05 09:30:00");
      expect(result).toBe(new Date("2026-03-05T09:30:00+02:00").toISOString());
    });

    it("prefers shape-1 match over fallback", () => {
      const result = parseBurgasDate("18 Април 2026", "2026-01-01 00:00:00");
      expect(result).toBe(new Date("2026-04-18T00:00:00+02:00").toISOString());
    });
  });

  describe("fallback to current date on invalid input", () => {
    it("returns current date and warns when both inputs are unparseable", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const before = Date.now();
      const result = parseBurgasDate("не е дата", "не е дата");
      const after = Date.now();

      const ts = new Date(result).getTime();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);

      warnSpy.mockRestore();
    });
  });
});
