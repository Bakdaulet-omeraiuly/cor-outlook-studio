import type { InterventionEffects } from "../../catalog/types";

/**
 * Statin — effect on LV structural parameters.
 *
 * Statins have robust outcome evidence (e.g. CTT Collaboration, Lancet 2010,
 * DOI: 10.1016/S0140-6736(10)61350-5) but a *direct, quantified* effect on
 * LV mass index / wall thickness as a structural regression is NOT established
 * by a clean meta-analysis. Rather than invent a structural number, the LVMI
 * effect is left unverified (excluded from computation).
 *
 * We do NOT claim a structural LVMI change here without a numeric source.
 */
export const statinEffects: InterventionEffects = {
  interventionId: "statin",
  effects: [
    {
      parameterId: "lvmi",
      dist: { deltaMean: 0, delta95: [0, 0] },
      citation: {
        authors: "TODO",
        year: 0,
        journal: "TODO",
      },
      evidenceGrade: "C",
      population: "Not directly sourced for LV mass regression",
      verified: false,
      note:
        "TODO: statins reduce cardiovascular events (CTT 2010) but a quantified " +
        "LV-mass-index regression is not established; excluded from computation " +
        "to avoid inventing a structural number.",
    },
  ],
};
