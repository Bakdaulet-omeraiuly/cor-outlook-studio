import type { InterventionEffects } from "../../catalog/types";

/**
 * Smoking cessation — brain.
 *
 * Smoking is associated with accelerated cortical thinning, and cessation with
 * partial recovery over years (Karama S, et al. Mol Psychiatry.
 * 2015;20(6):778-785. DOI: 10.1038/mp.2014.187), but this is observational and
 * not a randomized structural effect size usable as a point estimate. No
 * number invented; marked unverified and excluded. Documented in evidence.md.
 */
export const smokingCessationBrainEffects: InterventionEffects = {
  interventionId: "smoking_cessation",
  effects: [
    {
      parameterId: "cortical_thickness",
      dist: { deltaMean: 0, delta95: [0, 0] },
      citation: {
        authors: "Karama S, Ducharme S, Corley J, et al.",
        year: 2015,
        journal: "Mol Psychiatry",
        doi: "10.1038/mp.2014.187",
      },
      evidenceGrade: "C",
      population: "Older adults (observational cohort)",
      verified: false,
      illustrative: true,
      note:
        "TODO: observational cortical-thinning recovery; no randomized " +
        "structural effect size. Excluded from computation.",
    },
  ],
};
