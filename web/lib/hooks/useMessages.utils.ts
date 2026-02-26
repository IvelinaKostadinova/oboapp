import { roundCoordinate } from "@oboapp/shared";

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Builds the API URL for fetching messages with optional viewport bounds.
 * Coordinates are rounded to 6 decimal places (~0.1m precision) to avoid
 * excessively long query strings from raw floating-point Google Maps values.
 *
 * @param bounds - Optional viewport bounds to filter messages
 * @returns API URL with query parameters if bounds are provided
 */
export function buildMessagesUrl(bounds?: ViewportBounds | null): string {
  let url = "/api/messages";
  if (bounds) {
    const params = new URLSearchParams({
      north: roundCoordinate(bounds.north).toString(),
      south: roundCoordinate(bounds.south).toString(),
      east: roundCoordinate(bounds.east).toString(),
      west: roundCoordinate(bounds.west).toString(),
    });
    url += `?${params.toString()}`;
  }
  return url;
}
