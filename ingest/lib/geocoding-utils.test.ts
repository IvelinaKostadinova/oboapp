import { describe, it, expect } from "vitest";
import {
  SOFIA_BOUNDS,
  SOFIA_CENTER,
  SOFIA_BBOX,
  isWithinSofia,
} from "./geocoding-utils";

describe("geocoding-utils", () => {
  describe("constants", () => {
    it("should have correct Sofia bounds", () => {
      expect(SOFIA_BOUNDS).toEqual({
        south: 42.605,
        west: 23.188,
        north: 42.83,
        east: 23.528,
      });
    });

    it("should have Sofia center coordinates", () => {
      expect(SOFIA_CENTER).toEqual({ lat: 42.6977, lng: 23.3219 });
    });

    it("should format SOFIA_BBOX correctly", () => {
      expect(SOFIA_BBOX).toBe("42.605,23.188,42.83,23.528");
    });

    it("should have Sofia center within Sofia bounds", () => {
      expect(isWithinSofia(SOFIA_CENTER.lat, SOFIA_CENTER.lng)).toBe(true);
    });
  });

  describe("isWithinSofia", () => {
    it("should return true for coordinates within Sofia", () => {
      // Sofia city center (Oborishte district)
      expect(isWithinSofia(42.6977, 23.3219)).toBe(true);

      // NDK (National Palace of Culture)
      expect(isWithinSofia(42.6847, 23.3188)).toBe(true);

      // Sofia Airport
      expect(isWithinSofia(42.695, 23.411)).toBe(true);
    });

    it("should return true for coordinates on the boundary", () => {
      // Southwest corner
      expect(isWithinSofia(SOFIA_BOUNDS.south, SOFIA_BOUNDS.west)).toBe(true);

      // Northeast corner
      expect(isWithinSofia(SOFIA_BOUNDS.north, SOFIA_BOUNDS.east)).toBe(true);

      // Northwest corner
      expect(isWithinSofia(SOFIA_BOUNDS.north, SOFIA_BOUNDS.west)).toBe(true);

      // Southeast corner
      expect(isWithinSofia(SOFIA_BOUNDS.south, SOFIA_BOUNDS.east)).toBe(true);
    });

    it("should return false for coordinates outside Sofia", () => {
      // Plovdiv
      expect(isWithinSofia(42.1354, 24.7453)).toBe(false);

      // Varna
      expect(isWithinSofia(43.2141, 27.9147)).toBe(false);

      // London
      expect(isWithinSofia(51.5074, -0.1278)).toBe(false);
    });

    it("should return false for coordinates just outside bounds", () => {
      // Just south of Sofia
      expect(isWithinSofia(SOFIA_BOUNDS.south - 0.001, 23.3)).toBe(false);

      // Just north of Sofia
      expect(isWithinSofia(SOFIA_BOUNDS.north + 0.001, 23.3)).toBe(false);

      // Just west of Sofia
      expect(isWithinSofia(42.7, SOFIA_BOUNDS.west - 0.001)).toBe(false);

      // Just east of Sofia
      expect(isWithinSofia(42.7, SOFIA_BOUNDS.east + 0.001)).toBe(false);
    });

    it("should handle edge cases", () => {
      // Zero coordinates
      expect(isWithinSofia(0, 0)).toBe(false);

      // Negative coordinates (valid for some locations)
      expect(isWithinSofia(-42.7, -23.3)).toBe(false);

      // Very large coordinates
      expect(isWithinSofia(90, 180)).toBe(false);
      expect(isWithinSofia(-90, -180)).toBe(false);
    });
  });
});
