import type { Citation } from "../catalog/types";

/**
 * Cited pairwise interaction terms.
 *
 * An interaction applies an EXTRA relative multiplier (1 + deltaMean) to a
 * parameter when BOTH interventions in the unordered pair are applied. It must
 * carry a citation. v0.1 ships NO interaction terms: in the absence of a cited
 * source we assume independence (the honest default), rather than inventing a
 * synergy or antagonism. Add entries here only with a published source.
 */
export interface InteractionTerm {
  /** Unordered pair of intervention ids (store sorted). */
  pair: [string, string];
  parameterId: string;
  deltaMean: number;
  delta95: [number, number];
  citation: Citation;
}

export const INTERACTIONS: InteractionTerm[] = [
  // Intentionally empty in v0.1 — no cited pairwise structural interaction
  // terms identified yet. See docs/evidence.md.
];

export function findInteraction(
  idA: string,
  idB: string,
  parameterId: string,
): InteractionTerm | undefined {
  const [a, b] = [idA, idB].sort();
  return INTERACTIONS.find(
    (t) =>
      t.parameterId === parameterId &&
      t.pair[0] === a &&
      t.pair[1] === b,
  );
}
