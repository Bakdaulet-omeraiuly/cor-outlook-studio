import type { InterventionEffects } from "../../catalog/types";

/**
 * Smoking cessation — heart.
 *
 * Smoking cessation strongly reduces cardiovascular events, but a quantified
 * effect on an LV structural parameter (LVMI, wall thickness) is not
 * established by a dedicated meta-analysis. No structural number is invented;
 * the LVMI effect is marked unverified and excluded from computation.
 */
export const smokingCessationHeartEffects: InterventionEffects = {
  interventionId: "smoking_cessation",
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
      population: "Not directly sourced for LV structure",
      verified: false,
      note:
        "TODO: no quantified LV structural regression for smoking cessation; " +
        "excluded from computation.",
    },
  ],
};
