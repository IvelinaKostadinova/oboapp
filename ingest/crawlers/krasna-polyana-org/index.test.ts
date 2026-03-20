import { describe, expect, it } from "vitest";
import { parseKrasnaPolyanaDate } from "./index";

describe("krasna-polyana-org/index date parser", () => {
  it("parses ISO date strings directly", () => {
    const iso = parseKrasnaPolyanaDate("2026-03-20T08:00:00+00:00");

    expect(iso).toBe("2026-03-20T08:00:00.000Z");
  });

  it("parses Bulgarian date strings", () => {
    const iso = parseKrasnaPolyanaDate("20.03.2026");
    const parsed = new Date(iso);

    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(2);
    expect(parsed.getUTCDate()).toBe(20);
  });

  it("throws when date text is empty", () => {
    expect(() => parseKrasnaPolyanaDate("   ")).toThrow(
      "Missing date text for krasna-polyana-org post",
    );
  });
});
