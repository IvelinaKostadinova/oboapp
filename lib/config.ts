/**
 * Geocoding configuration
 */

export type GeocodingAlgorithm = "google_geocoding" | "google_directions";

// Configuration: Choose which geocoding algorithm to use
export const GEOCODING_ALGO: GeocodingAlgorithm = "google_geocoding";

// Log the active configuration
console.log(`🗺️ Geocoding Algorithm: ${GEOCODING_ALGO}`);

// Get the appropriate data extraction prompt based on geocoding algorithm
export function getDataExtractionPromptPath(): string {
  switch (GEOCODING_ALGO) {
    case "google_directions":
      return "lib/prompts/data-extraction-directions.md";
    case "google_geocoding":
      return "lib/prompts/data-extraction.md";
    default:
      return "lib/prompts/data-extraction.md";
  }
}
