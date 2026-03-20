import { describe, expect, it } from "vitest";
import { parseTriaditsaDate } from "./index";

describe("triaditsa-org/index date parser", () => {
  it("parses ISO date strings directly", () => {
    const iso = parseTriaditsaDate("2026-03-12T10:31:30+00:00");

    expect(iso).toBe("2026-03-12T10:31:30.000Z");
  });

  it("parses Bulgarian date strings", () => {
    const iso = parseTriaditsaDate("17.03.2026");
    const parsed = new Date(iso);

    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(2);
    expect(parsed.getUTCDate()).toBe(17);
  });

  it("throws when date text is empty", () => {
    expect(() => parseTriaditsaDate("   ")).toThrow(
      "Missing date text for triaditsa-org post",
    );
  });
});