import { describe, expect, it } from "vitest";
import { parseTriaditsaDate, resolveTriaditsaDateText } from "./index";

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

  it("falls back to current timestamp when date text is empty", () => {
    const iso = parseTriaditsaDate("   ");
    expect(Number.isNaN(Date.parse(iso))).toBe(false);
  });

  it("falls back to listing date when extracted date is empty", () => {
    const resolved = resolveTriaditsaDateText("   ", "17.03.2026");
    expect(resolved).toBe("17.03.2026");
  });

  it("prefers extracted date over listing date", () => {
    const resolved = resolveTriaditsaDateText(
      "2026-03-12T10:31:30+00:00",
      "17.03.2026",
    );
    expect(resolved).toBe("2026-03-12T10:31:30+00:00");
  });
});