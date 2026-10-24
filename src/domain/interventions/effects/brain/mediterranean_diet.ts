import type { InterventionEffects } from "../../catalog/types";

/**
 * Mediterranean-type diet — brain.
 *
 * Observational cohorts associate higher Mediterranean-diet adherence with
 * larger total brain / cortical volumes and less atrophy (e.g. Luciano M, et
 * al. Neurology. 2017;88(5):449-455. DOI: 10.1212/WNL.0000000000003559), but
 * these are observational associations, not a randomized structural effect
 * size. To respect the "cited RCT/meta-analysis or exclude" rule, no
 * structural point estimate is asserted; this effect is marked unverified and
 * excluded from computation. Documented in evidence.md as observational.
 */
export const mediterraneanDietBrainEffects: InterventionEffects = {
  interventionId: "mediterranean_diet",
  effects: [
    {
      parameterId: "cortical_thickness",
      dist: { deltaMean: 0, delta95: [0, 0] },
      citation: {
        authors: "Luciano M, Corley J, Cox SR, et al.",
        year: 2017,
        journal: "Neurology",
        doi: "10.1212/WNL.0000000000003559",
      },
      evidenceGrade: "C",
      population: "Older adults (observational cohort)",
      verified: false,
      illustrative: true,
      note:
        "TODO: association is observational; no randomized structural effect " +
        "size. Excluded from computation; shown as illustrative/observational.",
    },
  ],
};
