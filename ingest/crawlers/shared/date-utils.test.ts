import { describe, it, expect } from "vitest";
import { parseBulgarianDate } from "./date-utils";

describe("parseBulgarianDate", () => {
  it("should parse valid Bulgarian date format (DD.MM.YYYY)", () => {
    const result = parseBulgarianDate("19.12.2025");
    const date = new Date(result);

    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(11); // December is month 11 (0-indexed)
    expect(date.getDate()).toBe(19);
  });

  it("should parse date with leading zeros", () => {
    const result = parseBulgarianDate("05.03.2024");
    const date = new Date(result);

    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2); // March
    expect(date.getDate()).toBe(5);
  });

  it("should parse date without leading zeros", () => {
    const result = parseBulgarianDate("1.1.2024");
    const date = new Date(result);

    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(1);
  });

  it("should handle dates with extra whitespace", () => {
    const result = parseBulgarianDate("  15.06.2024  ");
    const date = new Date(result);

    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(5); // June
    expect(date.getDate()).toBe(15);
  });

  it("should return current date for invalid format (missing parts)", () => {
    const before = new Date();
    const result = parseBulgarianDate("19.12");
    const after = new Date();
    const resultDate = new Date(result);

    // Should be between before and after timestamps
    expect(resultDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("should return current date for invalid format (non-date string)", () => {
    const before = new Date();
    const result = parseBulgarianDate("not a date");
    const after = new Date();
    const resultDate = new Date(result);

    expect(resultDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("should return current date for empty string", () => {
    const before = new Date();
    const result = parseBulgarianDate("");
    const after = new Date();
    const resultDate = new Date(result);

    expect(resultDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("should return current date for invalid date values", () => {
    const before = new Date();
    const result = parseBulgarianDate("32.13.2024"); // Invalid day and month
    const after = new Date();
    const resultDate = new Date(result);

    expect(resultDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("should parse edge case dates correctly", () => {
    // Last day of year
    const result1 = parseBulgarianDate("31.12.2024");
    const date1 = new Date(result1);
    expect(date1.getMonth()).toBe(11);
    expect(date1.getDate()).toBe(31);

    // First day of year
    const result2 = parseBulgarianDate("01.01.2024");
    const date2 = new Date(result2);
    expect(date2.getMonth()).toBe(0);
    expect(date2.getDate()).toBe(1);

    // Leap year date
    const result3 = parseBulgarianDate("29.02.2024");
    const date3 = new Date(result3);
    expect(date3.getMonth()).toBe(1);
    expect(date3.getDate()).toBe(29);
  });
});
