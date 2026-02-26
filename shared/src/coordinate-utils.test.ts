import { describe, it, expect } from "vitest";
import { roundCoordinate } from "./coordinate-utils";

describe("roundCoordinate", () => {
  it("should round to 6 decimal places by default", () => {
    expect(roundCoordinate(42.7013091079358)).toBe(42.701309);
    expect(roundCoordinate(23.3229612178934)).toBe(23.322961);
  });

  it("should handle rounding up", () => {
    expect(roundCoordinate(42.7006349)).toBe(42.700635);
    expect(roundCoordinate(23.3226669)).toBe(23.322667);
  });

  it("should handle rounding down", () => {
    expect(roundCoordinate(42.7006341)).toBe(42.700634);
    expect(roundCoordinate(23.3226661)).toBe(23.322666);
  });

  it("should handle coordinates with fewer decimal places", () => {
    expect(roundCoordinate(42.7)).toBe(42.7);
    expect(roundCoordinate(23.32)).toBe(23.32);
  });

  it("should handle negative coordinates", () => {
    expect(roundCoordinate(-42.7013091079358)).toBe(-42.701309);
    expect(roundCoordinate(-23.3229612178934)).toBe(-23.322961);
  });

  it("should handle zero", () => {
    expect(roundCoordinate(0)).toBe(0);
    expect(roundCoordinate(0.0000001)).toBe(0);
  });

  it("should respect custom decimal places", () => {
    expect(roundCoordinate(42.7013091079358, 4)).toBe(42.7013);
    expect(roundCoordinate(42.7013091079358, 7)).toBe(42.7013091);
    expect(roundCoordinate(42.7013091079358, 2)).toBe(42.7);
  });
});
