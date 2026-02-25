import { describe, it, expect } from "vitest";
import {
  parseBulgarianDateOrRange,
  isDateRelevant,
} from "../shared/date-utils";

describe("rayon-pancharevo-bg/date filtering", () => {
  it("parses single date with month name", () => {
    const range = parseBulgarianDateOrRange("27 януари 2026");
    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeInstanceOf(Date);
    expect(range.start.getTime()).toBe(range.end.getTime());
  });

  it("parses date range with implicit month", () => {
    const range = parseBulgarianDateOrRange("24-26.02.2026");
    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(1);
    expect(range.start.getDate()).toBe(24);
    expect(range.end.getDate()).toBe(26);
  });

  it("parses date range across months", () => {
    const range = parseBulgarianDateOrRange("28.02-02.03.2026");
    expect(range.start.getMonth()).toBe(1);
    expect(range.end.getMonth()).toBe(2);
  });

  it("returns true when today is inside range", () => {
    const today = new Date("2026-02-25T10:00:00.000Z");
    const range = parseBulgarianDateOrRange("24-26.02.2026");

    expect(isDateRelevant(range, today)).toBe(true);
  });

  it("returns false when range is outdated", () => {
    const today = new Date("2026-02-25T10:00:00.000Z");
    const range = parseBulgarianDateOrRange("10-12.01.2026");

    expect(isDateRelevant(range, today)).toBe(false);
  });
});
