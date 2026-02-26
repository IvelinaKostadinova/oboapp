/**
 * Round a coordinate to specified decimal places.
 * 6 decimal places ≈ 0.1m precision — more than enough for map viewport queries and storage.
 *
 * @param coord - The coordinate value (latitude or longitude)
 * @param decimals - Number of decimal places (default: 6, ~0.1m precision)
 * @returns Rounded coordinate
 */
export function roundCoordinate(coord: number, decimals = 6): number {
  const multiplier = 10 ** decimals;
  return Math.round(coord * multiplier) / multiplier;
}
