import type { InterventionEffects } from "../../catalog/types";

/**
 * Intensive blood-pressure control — brain.
 *
 * SPRINT MIND Investigators. "Association of Intensive vs Standard Blood
 * Pressure Control With Cerebral White Matter Lesions." JAMA.
 * 2019;322(6):524-534. DOI: 10.1001/jama.2019.10551
 * Intensive BP control slowed accumulation of white-matter-lesion volume
 * (intensive +0.92 cm^3 vs standard +1.45 cm^3 median increase over ~4 y) and
 * was associated with a small reduction in total brain volume.
 *
 * This library's brain model does not expose a white-matter-lesion parameter
 * in v0.1, and SPRINT MIND did NOT report a hippocampal-volume increase from
 * BP control. Therefore no hippocampal or cortical-thickness number is
 * invented here; the measured white-matter benefit is documented in
 * evidence.md and this structural-parameter effect is marked unverified.
 *
 * The cognitive benefit (reduced MCI) is from the primary SPRINT MIND report:
 * Williamson JD, et al. JAMA. 2019;321(6):553-561.
 * DOI: 10.1001/jama.2018.21442  (outcome, not a structural parameter here).
 */
export const bpControlBrainEffects: InterventionEffects = {
  interventionId: "bp_control",
  effects: [
    {
      parameterId: "ventricular_volume",
      dist: { deltaMean: 0, delta95: [0, 0] },
      citation: {
        authors: "SPRINT MIND Investigators",
        year: 2019,
        journal: "JAMA",
        doi: "10.1001/jama.2019.10551",
        trial: "SPRINT MIND",
      },
      evidenceGrade: "A",
      population: "Hypertensive adults (RCT MRI substudy)",
      verified: false,
      note:
        "TODO: SPRINT MIND measured white-matter-lesion volume (not modeled in " +
        "v0.1) and total brain volume, not lateral ventricular volume; no " +
        "structural number mapped onto this parameter. Excluded from computation.",
    },
  ],
};
