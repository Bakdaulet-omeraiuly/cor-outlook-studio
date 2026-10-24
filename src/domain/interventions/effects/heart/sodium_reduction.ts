import type { InterventionEffects } from "../../catalog/types";

/**
 * Dietary sodium reduction — LV mass.
 *
 * Sodium restriction lowers blood pressure (He FJ, Li J, MacGregor GA.
 * "Effect of longer term modest salt reduction on blood pressure." BMJ.
 * 2013;346:f1325. DOI: 10.1136/bmj.f1325). A *direct* quantified effect on LV
 * mass index attributable to sodium reduction independent of BP is not
 * cleanly established by a dedicated meta-analysis. To avoid inventing a
 * structural number, the LVMI effect here is modeled as small and marked
 * unverified (excluded from computation); the BP-lowering mechanism is
 * documented in evidence.md.
 */
export const sodiumReductionEffects: InterventionEffects = {
  interventionId: "sodium_reduction",
  effects: [
    {
      parameterId: "lvmi",
      dist: { deltaMean: 0, delta95: [0, 0] },
      citation: {
        authors: "He FJ, Li J, MacGregor GA",
        year: 2013,
        journal: "BMJ",
        doi: "10.1136/bmj.f1325",
      },
      evidenceGrade: "C",
      population: "Adults (salt-reduction BP meta-analysis; structural effect not quantified)",
      verified: false,
      note:
        "TODO: sodium reduction lowers BP (He 2013) but an LV-mass-index " +
        "regression figure independent of BP is not established; excluded.",
    },
  ],
};
