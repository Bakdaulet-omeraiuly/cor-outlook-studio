import type { InterventionEffects } from "../../catalog/types";

/**
 * Aerobic exercise — heart.
 *
 * Endurance exercise produces physiological LV adaptation. A clean,
 * *disease-regression* LV mass index number for ~150 min/week aerobic exercise
 * in a general cohort is not cleanly separable from athlete remodeling (where
 * LV mass may increase physiologically). To avoid misrepresenting athletic
 * hypertrophy as pathological regression, the LVMI effect is left unverified
 * and excluded. Exercise's blood-pressure benefit is documented in evidence.md.
 *
 * Cornelissen VA, Smart NA. "Exercise training for blood pressure: a
 * systematic review and meta-analysis." J Am Heart Assoc. 2013;2(1):e004473.
 * DOI: 10.1161/JAHA.112.004473  (BP effect; not a direct LVMI regression.)
 */
export const aerobicExerciseHeartEffects: InterventionEffects = {
  interventionId: "aerobic_exercise",
  effects: [
    {
      parameterId: "lvmi",
      dist: { deltaMean: 0, delta95: [0, 0] },
      citation: {
        authors: "Cornelissen VA, Smart NA",
        year: 2013,
        journal: "J Am Heart Assoc",
        doi: "10.1161/JAHA.112.004473",
      },
      evidenceGrade: "C",
      population: "Adults (exercise-BP meta-analysis; structural LVMI not isolated)",
      verified: false,
      note:
        "TODO: a pathological-LVMI-regression figure for moderate aerobic " +
        "exercise is confounded by physiological athlete remodeling; excluded.",
    },
  ],
};
