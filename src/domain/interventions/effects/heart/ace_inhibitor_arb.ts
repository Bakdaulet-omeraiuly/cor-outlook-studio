import type { InterventionEffects } from "../../catalog/types";

/**
 * ACE inhibitor / ARB — LV mass regression.
 *
 * Klingbeil AU, Schneider M, Martus P, Messerli FH, Schmieder RE.
 * "A meta-analysis of the effects of treatment on left ventricular mass in
 * essential hypertension." Am J Med. 2003;115(1):41-46.
 * DOI: 10.1016/S0002-9343(03)00158-X
 * Reported LVMI reduction: ARB -13% (95% CI 8-18%), ACE inhibitor -10%
 * (95% CI 8-12%). We model the class with a pooled central estimate of -11%
 * and a CI spanning both agents' reported bounds (-8% to -15%).
 *
 * LV wall thickness tracks mass regression but the meta-analysis reports mass,
 * not wall thickness, so a wall-thickness point estimate is NOT directly
 * sourced here and is left unverified rather than invented.
 */
export const aceInhibitorArbEffects: InterventionEffects = {
  interventionId: "ace_inhibitor_arb",
  effects: [
    {
      parameterId: "lvmi",
      dist: { deltaMean: -0.11, delta95: [-0.08, -0.15] },
      citation: {
        authors: "Klingbeil AU, Schneider M, Martus P, Messerli FH, Schmieder RE",
        year: 2003,
        journal: "Am J Med",
        doi: "10.1016/S0002-9343(03)00158-X",
      },
      evidenceGrade: "A",
      population: "Adults with essential hypertension (meta-analysis)",
      verified: true,
      // Klingbeil 2003 pooled trials of varying length; representative mean
      // treatment duration ~1 year. Held beyond that is an extrapolation.
      followUpYears: 1,
      durability: "held",
    },
    {
      parameterId: "lv_wall_thickness",
      dist: { deltaMean: 0, delta95: [0, 0] },
      citation: {
        authors: "TODO",
        year: 0,
        journal: "TODO",
      },
      evidenceGrade: "C",
      population: "Not directly sourced",
      verified: false,
      note:
        "TODO: wall-thickness-specific regression under RAAS blockade not yet " +
        "sourced to a numeric meta-analysis; excluded from computation.",
    },
  ],
};
