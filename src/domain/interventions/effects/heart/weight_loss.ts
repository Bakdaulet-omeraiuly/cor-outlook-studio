import type { InterventionEffects } from "../../catalog/types";

/**
 * Weight loss — LV mass regression in obesity.
 *
 * MacMahon SW, Wilcken DE, Macdonald GJ. "The effect of weight reduction on
 * left ventricular mass. A randomized controlled trial in young, overweight
 * hypertensive patients." N Engl J Med. 1986;314(6):334-339.
 * DOI: 10.1056/NEJM198602063140602
 * Weight reduction reduced LV mass substantially and independently of BP.
 *
 * Corroborated by: Cuspidi C, et al. "Effects of bariatric surgery on cardiac
 * structure and function: a systematic review and meta-analysis."
 * Am J Hypertens. 2014;27(2):146-156. DOI: 10.1093/ajh/hpt215
 * (LV mass standardized mean difference -0.46, p<0.001).
 *
 * Non-surgical weight loss effect modeled conservatively as -0.08 relative on
 * LVMI with a wide CI (-0.03 to -0.14), smaller than bariatric magnitudes.
 */
export const weightLossEffects: InterventionEffects = {
  interventionId: "weight_loss",
  effects: [
    {
      parameterId: "lvmi",
      dist: { deltaMean: -0.08, delta95: [-0.03, -0.14] },
      citation: {
        authors: "MacMahon SW, Wilcken DE, Macdonald GJ",
        year: 1986,
        journal: "N Engl J Med",
        doi: "10.1056/NEJM198602063140602",
      },
      evidenceGrade: "B",
      population: "Overweight hypertensive adults (RCT)",
      verified: true,
      followUpYears: 1,
      durability: "held",
    },
  ],
};
