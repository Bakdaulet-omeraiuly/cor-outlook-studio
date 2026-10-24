import type { InterventionEffects } from "../../catalog/types";

/**
 * Aerobic exercise — brain (hippocampal volume).
 *
 * Erickson KI, Voss MW, Prakash RS, et al. "Exercise training increases size
 * of hippocampus and improves memory." Proc Natl Acad Sci USA.
 * 2011;108(7):3017-3022. DOI: 10.1073/pnas.1015950108
 * RCT, 120 older adults: aerobic training increased hippocampal volume by ~2%
 * (left +2.12%, right +1.97%), vs ~1.4% decline in the stretching control.
 *
 * Central modeled as +0.02 (2%). CI approximated to reflect the net
 * exercise-vs-control difference and sampling spread (+0.01 to +0.034).
 */
export const aerobicExerciseBrainEffects: InterventionEffects = {
  interventionId: "aerobic_exercise",
  effects: [
    {
      parameterId: "hippocampal_volume",
      dist: { deltaMean: 0.02, delta95: [0.01, 0.034] },
      citation: {
        authors: "Erickson KI, Voss MW, Prakash RS, et al.",
        year: 2011,
        journal: "Proc Natl Acad Sci USA",
        doi: "10.1073/pnas.1015950108",
      },
      evidenceGrade: "B",
      population: "Community-dwelling older adults (RCT)",
      verified: true,
      // Erickson 2011 measured the +2% hippocampal change over a 1-year
      // training programme; held beyond 1 y is an extrapolation.
      followUpYears: 1,
      durability: "held",
    },
  ],
};
