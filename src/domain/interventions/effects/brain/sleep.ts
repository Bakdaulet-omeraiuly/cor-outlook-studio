import type { InterventionEffects } from "../../catalog/types";

/**
 * Sleep optimization — brain.
 *
 * Observational studies link poor/short sleep with faster brain-volume loss
 * and larger ventricles (e.g. Sexton CE, et al. Neurology. 2014;83(11):967-973.
 * DOI: 10.1212/WNL.0000000000000774), but there is no randomized structural
 * effect size for a sleep intervention. No number is invented; marked
 * unverified and excluded. Documented in evidence.md as observational.
 */
export const sleepBrainEffects: InterventionEffects = {
  interventionId: "sleep",
  effects: [
    {
      parameterId: "ventricular_volume",
      dist: { deltaMean: 0, delta95: [0, 0] },
      citation: {
        authors: "Sexton CE, Storsve AB, Walhovd KB, Johansen-Berg H, Fjell AM",
        year: 2014,
        journal: "Neurology",
        doi: "10.1212/WNL.0000000000000774",
      },
      evidenceGrade: "C",
      population: "Older adults (observational cohort)",
      verified: false,
      illustrative: true,
      note:
        "TODO: association is observational; no randomized structural effect " +
        "size for a sleep intervention. Excluded from computation.",
    },
  ],
};
