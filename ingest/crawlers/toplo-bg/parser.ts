import type { FeatureCollection } from "geojson";
import type { ToploIncident, ToploIncidentInfo } from "./types";

/**
 * Extract incidents from Toplo.bg HTML containing embedded JavaScript
 */
export function parseIncidents(html: string): ToploIncident[] {
  const incidents: ToploIncident[] = [];

  // Extract all script content
  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  if (!scriptMatch) {
    return incidents;
  }

  // Find the script containing parseAll function
  const parseAllScript = scriptMatch.find((script) =>
    script.includes("function parseAll()")
  );

  if (!parseAllScript) {
    return incidents;
  }

  // Extract each incident block using regex
  // Pattern: var geoJsonString = '...' var info = {...}
  const incidentPattern =
    /var geoJsonString = '(.+?)'\s*var info = ({[\s\S]+?})\s*if \(geoJsonString/g;

  let match;
  while ((match = incidentPattern.exec(parseAllScript)) !== null) {
    try {
      const [, geoJsonString, infoString] = match;

      // Parse GeoJSON
      const geoJson: FeatureCollection = JSON.parse(geoJsonString);

      // Parse info object - it's already valid JSON with double quotes
      // Handle escaped quotes in string values
      const info: ToploIncidentInfo = JSON.parse(infoString);

      incidents.push({ info, geoJson });
    } catch (error) {
      console.warn("Failed to parse incident:", (error as Error).message);
      continue;
    }
  }

  return incidents;
}
