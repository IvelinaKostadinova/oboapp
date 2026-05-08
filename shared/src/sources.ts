export type { SourceDefinition } from "./source-definition";

// ─────────────────────────────────────────────────────────────────────────────
// INSTANCE ASSEMBLY — replace this file in your fork
// ─────────────────────────────────────────────────────────────────────────────
// When you fork oboapp for your city:
//   1. Replace this file with your own assembly.
//   2. Import the source definition files relevant to your deployment.
//   3. Add any city-specific sources that live only in your fork.
//
// See docs/setup/new-locality-instance.md for the full guide.
// ─────────────────────────────────────────────────────────────────────────────
import burgasBg from "./sources/burgas-bg";
import burgasOrg from "./sources/burgas-org";

export const SOURCES = [
  burgasBg,
  burgasOrg,
] as const;

/**
 * Source IDs passed to `pipeline --emergent` (the legacy ingest pipeline path).
 * Derived from the `emergent` flag on each source in this SOURCES assembly.
 * Note: Terraform scheduling is independent — it uses `emergent = true` in
 * the crawler's Terraform entry, not this list.
 */
export const EMERGENT_CRAWLERS: readonly string[] = SOURCES.filter(
  (s) => s.emergent,
).map((s) => s.id);
