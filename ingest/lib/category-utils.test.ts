import { describe, it, expect } from "vitest";
import { normalizeCategoriesInput } from "./category-utils";

describe("normalizeCategoriesInput", () => {
  it("should return arrays unchanged but trimmed", () => {
    const result = normalizeCategoriesInput([" water ", "traffic"]);
    expect(result).toEqual(["water", "traffic"]);
  });

  it("should parse JSON array strings", () => {
    const result = normalizeCategoriesInput('["water", "traffic"]');
    expect(result).toEqual(["water", "traffic"]);
  });

  it("should split comma-separated strings", () => {
    const result = normalizeCategoriesInput("water, traffic");
    expect(result).toEqual(["water", "traffic"]);
  });

  it("should coerce a single string to array", () => {
    const result = normalizeCategoriesInput("water");
    expect(result).toEqual(["water"]);
  });

  it("should normalize whitespace-only strings to empty array", () => {
    const result = normalizeCategoriesInput("   ");
    expect(result).toEqual([]);
  });
});
