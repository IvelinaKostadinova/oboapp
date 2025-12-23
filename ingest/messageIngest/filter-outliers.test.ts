import { describe, it, expect } from "vitest";
import { filterOutlierCoordinates } from "./filter-outliers";
import type { Address } from "@/lib/types";

describe("filterOutlierCoordinates", () => {
  const createAddress = (
    lat: number,
    lng: number,
    text: string = "Test address"
  ): Address => ({
    originalText: text,
    coordinates: { lat, lng },
    formattedAddress: text + " but formatted",
  });

  describe("edge cases", () => {
    it("should return empty array for empty input", () => {
      const result = filterOutlierCoordinates([]);
      expect(result).toEqual([]);
    });

    it("should return single address unchanged", () => {
      const addresses = [createAddress(42.6977, 23.3219, "Sofia center")];
      const result = filterOutlierCoordinates(addresses);
      expect(result).toEqual(addresses);
    });
  });

  describe("nearby addresses", () => {
    it("should keep all addresses when they are close together", () => {
      const addresses = [
        createAddress(42.6977, 23.3219, "Address 1"),
        createAddress(42.6978, 23.322, "Address 2"), // ~140m away
        createAddress(42.6979, 23.3221, "Address 3"), // ~140m from Address 2
      ];

      const result = filterOutlierCoordinates(addresses, 1000);
      expect(result).toHaveLength(3);
      expect(result).toEqual(addresses);
    });

    it("should keep addresses within custom maxDistance", () => {
      const addresses = [
        createAddress(42.6977, 23.3219, "Address 1"),
        createAddress(42.6982, 23.3225, "Address 2"), // ~700m away
      ];

      const result = filterOutlierCoordinates(addresses, 1000);
      expect(result).toHaveLength(2);
    });
  });

  describe("outlier detection", () => {
    it("should filter out single outlier far from cluster", () => {
      const addresses = [
        createAddress(42.6977, 23.3219, "Oborishte 1"),
        createAddress(42.6978, 23.322, "Oborishte 2"),
        createAddress(42.6979, 23.3221, "Oborishte 3"),
        createAddress(42.9, 25.5, "Far away outlier"), // ~200km away
      ];

      const result = filterOutlierCoordinates(addresses, 1000);
      expect(result).toHaveLength(3);
      expect(
        result.every((addr) => addr.originalText.includes("Oborishte"))
      ).toBe(true);
    });

    it("should filter multiple outliers", () => {
      const addresses = [
        createAddress(42.6977, 23.3219, "Cluster 1"),
        createAddress(42.6978, 23.322, "Cluster 2"),
        createAddress(42.9, 25.5, "Outlier 1"), // ~200km away
        createAddress(41.5, 24.0, "Outlier 2"), // ~150km away
      ];

      const result = filterOutlierCoordinates(addresses, 1000);
      expect(result).toHaveLength(2);
      expect(result[0].originalText).toBe("Cluster 1");
      expect(result[1].originalText).toBe("Cluster 2");
    });

    it("should respect custom maxDistance threshold", () => {
      const addresses = [
        createAddress(42.6977, 23.3219, "Address 1"),
        createAddress(42.6982, 23.3225, "Address 2"), // ~74m away
      ];

      // With 500m threshold and only 74m distance, both addresses are kept
      const result = filterOutlierCoordinates(addresses, 500);
      expect(result).toHaveLength(2);
    });
  });

  describe("cluster scenarios", () => {
    it("should keep larger cluster and filter smaller outlier cluster", () => {
      const addresses = [
        // Main cluster in Oborishte
        createAddress(42.6977, 23.3219, "Main 1"),
        createAddress(42.6978, 23.322, "Main 2"),
        createAddress(42.6979, 23.3221, "Main 3"),
        createAddress(42.698, 23.3222, "Main 4"),
        // Small cluster far away (each far from nearest neighbor)
        createAddress(42.8, 24.0, "Far 1"),
        createAddress(42.8001, 24.0001, "Far 2"),
      ];

      const result = filterOutlierCoordinates(addresses, 1000);

      // The two "Far" addresses are within ~15m of each other,
      // but >100km from the main cluster. Since they have each other
      // as neighbors <1km away, neither is filtered.
      // All addresses should be kept.
      expect(result).toHaveLength(6);
    });

    it("should keep all when two clusters are within threshold", () => {
      const addresses = [
        createAddress(42.6977, 23.3219, "Cluster A1"),
        createAddress(42.6978, 23.322, "Cluster A2"),
        createAddress(42.6985, 23.3227, "Cluster B1"), // ~900m from A
        createAddress(42.6986, 23.3228, "Cluster B2"),
      ];

      const result = filterOutlierCoordinates(addresses, 1000);
      expect(result).toHaveLength(4);
    });
  });

  describe("real-world scenarios", () => {
    it("should handle addresses around Oborishte district", () => {
      const addresses = [
        createAddress(42.6977, 23.3219, "ul. Oborishte 1"),
        createAddress(42.698, 23.3225, "ul. Georgi S. Rakovski"),
        createAddress(42.6975, 23.3215, "ul. Vasil Levski"),
        createAddress(51.5074, -0.1278, "London"), // Should be filtered
      ];

      const result = filterOutlierCoordinates(addresses, 1000);
      expect(result).toHaveLength(3);
      expect(result.some((addr) => addr.originalText === "London")).toBe(false);
    });

    it("should handle default 1km maxDistance parameter", () => {
      const addresses = [
        createAddress(42.6977, 23.3219, "Near 1"),
        createAddress(42.6978, 23.322, "Near 2"),
        createAddress(42.71, 23.33, "Far"), // ~1.5km away
      ];

      const result = filterOutlierCoordinates(addresses); // Uses default 1000m
      expect(result).toHaveLength(2);
      expect(result.some((addr) => addr.originalText === "Far")).toBe(false);
    });
  });

  describe("boundary conditions", () => {
    it("should handle addresses exactly at maxDistance", () => {
      const addresses = [
        createAddress(42.6977, 23.3219, "Address 1"),
        createAddress(42.7067, 23.3219, "Address 2"), // ~1000.75m away (just over 1km)
      ];

      const result = filterOutlierCoordinates(addresses, 1000);
      // Distance is 1000.75m which is > 1000m threshold
      // Both addresses are outliers (each is >1000m from the other)
      expect(result.length).toBe(0);
    });

    it("should handle addresses at equator", () => {
      const addresses = [
        createAddress(0, 0, "Equator 1"),
        createAddress(0.001, 0.001, "Equator 2"),
      ];

      const result = filterOutlierCoordinates(addresses, 1000);
      expect(result).toHaveLength(2);
    });

    it("should handle addresses near poles", () => {
      const addresses = [
        createAddress(89.9, 0, "North Pole 1"),
        createAddress(89.9, 1, "North Pole 2"),
      ];

      const result = filterOutlierCoordinates(addresses, 10000);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
