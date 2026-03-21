import { describe, expect, it, vi, afterEach } from "vitest";
import { parseVrabnitsaDate } from "./index";
import { logger } from "@/lib/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("vrabnitsa-org/index date parser", () => {
  it("parses ISO datetime strings directly", () => {
    const iso = parseVrabnitsaDate("2026-03-12T10:22:16+02:00");

    expect(iso).toBe("2026-03-12T08:22:16.000Z");
  });

  it("parses Bulgarian month-name dates", () => {
    const iso = parseVrabnitsaDate("12 март 2026");
    const parsed = new Date(iso);

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(12);
  });

  it("strips the published prefix before parsing", () => {
    const iso = parseVrabnitsaDate("Публикувано: 12 март 2026");
    const parsed = new Date(iso);

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(12);
  });

  it("warns when date text is empty", () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => logger);

    parseVrabnitsaDate("Публикувано:   ");

    expect(warnSpy).toHaveBeenCalledWith(
      "Empty date text when parsing vrabnitsa date",
      expect.objectContaining({
        originalText: "Публикувано:   ",
        sourceType: "vrabnitsa-org",
      }),
    );
  });

  it("does not warn for expected Bulgarian month-name dates", () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => logger);

    const iso = parseVrabnitsaDate("12 март 2026");
    const parsed = new Date(iso);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(12);
  });
});