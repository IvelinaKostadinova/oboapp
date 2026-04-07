import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCurrentLocalitySources,
  getExperimentalSources,
  getSourcesForLocality,
} from "./source-utils";

vi.mock("@/lib/sources", () => ({
  default: [
    {
      id: "city-source",
      url: "https://city.example",
      name: "City Source",
      localities: ["bg.sofia"],
    },
    {
      id: "district-source",
      url: "https://district.example",
      name: "District Source",
      localities: ["bg.sofia.oborishte"],
    },
    {
      id: "near-prefix-source",
      url: "https://near-prefix.example",
      name: "Near Prefix Source",
      localities: ["bg.sofiax"],
    },
    {
      id: "other-city-source",
      url: "https://other-city.example",
      name: "Other City Source",
      localities: ["bg.plovdiv"],
      experimental: true,
    },
    {
      id: "district-experimental-source",
      url: "https://district-exp.example",
      name: "District Experimental Source",
      localities: ["bg.sofia.triaditsa"],
      experimental: true,
    },
  ],
}));

describe("source-utils", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_LOCALITY;
  });

  it("matches exact and hierarchical locality IDs", () => {
    const result = getSourcesForLocality("bg.sofia");
    const ids = result.map((s) => s.id);

    expect(ids).toContain("city-source");
    expect(ids).toContain("district-source");
    expect(ids).toContain("district-experimental-source");
  });

  it("does not match non-boundary prefix localities", () => {
    const result = getSourcesForLocality("bg.sofia");
    const ids = result.map((s) => s.id);

    expect(ids).not.toContain("near-prefix-source");
  });

  it("does not treat broad locality values as wildcard prefixes", () => {
    const result = getSourcesForLocality("bg");

    expect(result).toEqual([]);
  });

  it("throws when NEXT_PUBLIC_LOCALITY is missing", () => {
    expect(() => getCurrentLocalitySources()).toThrow(
      "NEXT_PUBLIC_LOCALITY environment variable is required but not set",
    );
  });

  it("uses NEXT_PUBLIC_LOCALITY to resolve sources", () => {
    process.env.NEXT_PUBLIC_LOCALITY = "bg.sofia";

    const result = getCurrentLocalitySources();
    const ids = result.map((s) => s.id);

    expect(ids).toContain("city-source");
    expect(ids).toContain("district-source");
    expect(ids).not.toContain("other-city-source");
  });

  it("returns only experimental sources for current locality", () => {
    process.env.NEXT_PUBLIC_LOCALITY = "bg.sofia";

    const result = getExperimentalSources();
    const ids = result.map((s) => s.id);

    expect(ids).toEqual(["district-experimental-source"]);
  });
});
