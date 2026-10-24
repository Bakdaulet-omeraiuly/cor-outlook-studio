import type { InterventionEffects } from "../../catalog/types";

/**
 * SGLT2 inhibitor (empagliflozin) — reverse remodeling in HFrEF.
 *
 * Santos-Gallego CG, Vargas-Delgado AP, Requena-Ibanez JA, et al.
 * "Randomized Trial of Empagliflozin in Nondiabetic Patients With Heart
 * Failure and Reduced Ejection Fraction (EMPA-TROPISM)."
 * J Am Coll Cardiol. 2021;77(3):243-255. DOI: 10.1016/j.jacc.2020.11.008
 *
 * Reported (empagliflozin vs placebo, CMR):
 *   LV mass:       -17.8 +/- 31.9 g  vs  +4.1 +/- 13.4 g
 *   LV end-diastolic volume: -25.1 +/- 26.0 mL vs -1.5 mL
 *   EF increased significantly with empagliflozin.
 *
 * Baseline LV mass in EMPA-TROPISM was ~165 g, so the placebo-corrected
 * ~21.9 g net reduction is ~-13% relative on LV mass. We model LVMI with
 * central -0.13 and a CI reflecting the sizeable SD (-0.04 to -0.22).
 * EF improvement modeled as a relative +0.08 (HFrEF-specific).
 */
export const sglt2InhibitorEffects: InterventionEffects = {
  interventionId: "sglt2_inhibitor",
  effects: [
    {
      parameterId: "lvmi",
      dist: { deltaMean: -0.13, delta95: [-0.04, -0.22] },
      citation: {
        authors: "Santos-Gallego CG, Vargas-Delgado AP, Requena-Ibanez JA, et al.",
        year: 2021,
        journal: "J Am Coll Cardiol",
        doi: "10.1016/j.jacc.2020.11.008",
        trial: "EMPA-TROPISM",
      },
      evidenceGrade: "A",
      population: "Nondiabetic adults with HFrEF",
      verified: true,
      // EMPA-TROPISM measured CMR LV mass at 6 months.
      followUpYears: 0.5,
      durability: "held",
    },
    {
      parameterId: "ef",
      dist: { deltaMean: 0.08, delta95: [0.03, 0.13] },
      citation: {
        authors: "Santos-Gallego CG, Vargas-Delgado AP, Requena-Ibanez JA, et al.",
        year: 2021,
        journal: "J Am Coll Cardiol",
        doi: "10.1016/j.jacc.2020.11.008",
        trial: "EMPA-TROPISM",
      },
      evidenceGrade: "A",
      population: "Nondiabetic adults with HFrEF",
      verified: true,
      followUpYears: 0.5,
      durability: "held",
      note: "EF gain is HFrEF-specific; apply to reduced-EF baselines.",
    },
  ],
};
