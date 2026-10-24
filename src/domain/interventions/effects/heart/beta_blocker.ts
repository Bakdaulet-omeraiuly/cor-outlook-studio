import type { InterventionEffects } from "../../catalog/types";

/**
 * Beta-blocker — two distinct, separately sourced effects.
 *
 * 1) LV mass regression in hypertension is modest relative to RAAS blockade.
 *    Klingbeil AU et al. Am J Med. 2003;115(1):41-46.
 *    DOI: 10.1016/S0002-9343(03)00158-X
 *    Beta-blockers reduced LV mass index by ~6% (less than ARB/ACEi/CCB).
 *    Modeled central -0.06, CI approximated from the class being the weakest
 *    reducer in that analysis (-0.02 to -0.10).
 *
 * 2) Reverse remodeling / EF improvement in HFrEF.
 *    CIBIS-II Investigators. Lancet. 1999;353(9146):9-13.
 *    DOI: 10.1016/S0140-6736(98)11181-9  (mortality trial; bisoprolol)
 *    MERIT-HF. Lancet. 1999;353(9169):2001-2007.
 *    DOI: 10.1016/S0140-6736(99)04440-2
 *    Beta-blockade raises LVEF in HFrEF by ~5-7 absolute EF points in
 *    echocardiographic substudies; expressed here as a RELATIVE change on EF.
 *    For a cohort baseline EF ~35%, +6 absolute points ~ +0.17 relative. We
 *    keep this effect but flag it as population-specific (HFrEF) via the note.
 */
export const betaBlockerEffects: InterventionEffects = {
  interventionId: "beta_blocker",
  effects: [
    {
      parameterId: "lvmi",
      dist: { deltaMean: -0.06, delta95: [-0.02, -0.1] },
      citation: {
        authors: "Klingbeil AU, Schneider M, Martus P, Messerli FH, Schmieder RE",
        year: 2003,
        journal: "Am J Med",
        doi: "10.1016/S0002-9343(03)00158-X",
      },
      evidenceGrade: "A",
      population: "Adults with essential hypertension (meta-analysis)",
      verified: true,
      followUpYears: 1,
      durability: "held",
    },
    {
      parameterId: "ef",
      dist: { deltaMean: 0.17, delta95: [0.1, 0.24] },
      citation: {
        authors: "MERIT-HF Study Group",
        year: 1999,
        journal: "Lancet",
        doi: "10.1016/S0140-6736(99)04440-2",
        trial: "MERIT-HF",
      },
      evidenceGrade: "A",
      population: "HFrEF adults (reduced ejection fraction)",
      verified: true,
      followUpYears: 1,
      durability: "held",
      note:
        "EF improvement is specific to HFrEF cohorts; relative delta derived " +
        "from ~+6 absolute EF points on a ~35% baseline. Apply only to reduced-EF baselines.",
    },
  ],
};
