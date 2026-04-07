import sources from "@/lib/sources";

/** Mutable source type derived from the web-facing sources module (avoids readonly field incompatibilities). */
export type Source = (typeof sources)[number];

const isLocalityMatch = (sourceLocality: string, locality: string): boolean => {
  // Support hierarchical locality IDs, e.g. source "bg.sofia.oborishte"
  // should match instance locality "bg.sofia".
  if (sourceLocality === locality) {
    return true;
  }

  return sourceLocality.startsWith(`${locality}.`);
};

/**
 * Get sources applicable to a specific locality
 * @param locality - The locality ID (e.g., "bg.sofia")
 * @returns Array of sources that serve this locality
 */
export function getSourcesForLocality(locality: string): Source[] {
  return sources.filter((source) =>
    source.localities.some((sourceLocality) =>
      isLocalityMatch(sourceLocality, locality),
    ),
  );
}

/**
 * Get sources applicable to the current locality from environment
 * @returns Array of sources for the current NEXT_PUBLIC_LOCALITY
 * @throws Error if NEXT_PUBLIC_LOCALITY is not set
 */
export function getCurrentLocalitySources(): Source[] {
  const locality = process.env.NEXT_PUBLIC_LOCALITY;
  if (!locality) {
    throw new Error(
      "NEXT_PUBLIC_LOCALITY environment variable is required but not set",
    );
  }
  return getSourcesForLocality(locality);
}

/**
 * Get experimental sources for the current locality.
 * Returns sources whose `experimental` flag is true.
 */
export function getExperimentalSources(): Source[] {
  return getCurrentLocalitySources().filter((s) => s.experimental);
}
