import type { OrganId } from "../organ/types";
import type { Intervention } from "./types";

export type {
  Intervention,
  InterventionEffects,
  ParameterEffect,
  EffectDistribution,
  Citation,
  EvidenceGrade,
  InterventionKind,
} from "./types";

/**
 * Intervention registry. Metadata only; numeric effects live in src/effects.
 * `exclusiveClass` groups interventions that must not stack (e.g. two
 * renin-angiotensin inhibitors).
 */
export const INTERVENTIONS: Intervention[] = [
  // ---- Heart ----
  {
    id: "ace_inhibitor_arb",
    label: "ACE inhibitor / ARB",
    kind: "drug",
    organs: ["heart"],
    exclusiveClass: "renin_angiotensin_blocker",
    contraindications: [
      "pregnancy",
      "bilateral_renal_artery_stenosis",
      "hyperkalemia",
      "angioedema_history",
    ],
    evidenceGrade: "A",
    population:
      "Hypertensive adults with LV hypertrophy (LIFE substudy, Klingbeil meta-analysis)",
  },
  {
    id: "beta_blocker",
    label: "Beta-blocker",
    kind: "drug",
    organs: ["heart"],
    exclusiveClass: "beta_blocker",
    contraindications: [
      "severe_bradycardia",
      "high_grade_av_block",
      "decompensated_heart_failure",
    ],
    evidenceGrade: "A",
    population: "HFrEF adults (CIBIS-II, MERIT-HF reverse-remodeling data)",
  },
  {
    id: "statin",
    label: "Statin",
    kind: "drug",
    organs: ["heart"],
    exclusiveClass: "statin",
    contraindications: ["active_liver_disease", "pregnancy"],
    evidenceGrade: "B",
    population: "Adults with hypertension / at cardiovascular risk",
  },
  {
    id: "sglt2_inhibitor",
    label: "SGLT2 inhibitor",
    kind: "drug",
    organs: ["heart"],
    exclusiveClass: "sglt2_inhibitor",
    contraindications: ["type_1_diabetes", "recurrent_dka", "egfr_below_20"],
    evidenceGrade: "A",
    population: "Heart-failure / diabetic adults (EMPA-TROPISM reverse remodeling)",
  },
  {
    id: "aerobic_exercise",
    label: "Aerobic exercise (~150 min/week)",
    kind: "lifestyle",
    organs: ["heart", "brain"],
    contraindications: ["unstable_angina", "severe_aortic_stenosis"],
    evidenceGrade: "B",
    population: "Adults in structured aerobic-training trials",
  },
  {
    id: "sodium_reduction",
    label: "Dietary sodium reduction",
    kind: "lifestyle",
    organs: ["heart"],
    contraindications: ["hyponatremia", "salt_wasting_nephropathy"],
    evidenceGrade: "B",
    population: "Hypertensive adults (dietary-sodium meta-analyses)",
  },
  {
    id: "weight_loss",
    label: "Weight loss",
    kind: "lifestyle",
    organs: ["heart"],
    contraindications: ["active_eating_disorder", "underweight"],
    evidenceGrade: "B",
    population: "Overweight/obese adults with LV hypertrophy",
  },
  {
    id: "smoking_cessation",
    label: "Smoking cessation",
    kind: "lifestyle",
    organs: ["heart", "brain"],
    contraindications: [],
    evidenceGrade: "C",
    population: "Adult smokers",
  },

  // ---- Brain ----
  {
    id: "bp_control",
    label: "Intensive blood-pressure control",
    kind: "lifestyle",
    organs: ["brain"],
    contraindications: ["symptomatic_hypotension"],
    evidenceGrade: "A",
    population: "Hypertensive adults (SPRINT-MIND)",
  },
  {
    id: "mediterranean_diet",
    label: "Mediterranean-type diet",
    kind: "lifestyle",
    organs: ["brain"],
    contraindications: [],
    evidenceGrade: "C",
    population: "Older adults (observational / PREDIMET imaging substudies)",
  },
  {
    id: "sleep",
    label: "Sleep optimization (7-8 h)",
    kind: "lifestyle",
    organs: ["brain"],
    contraindications: [],
    evidenceGrade: "C",
    population: "Adults (observational sleep-neuroimaging cohorts)",
  },
];

const BY_ID = new Map(INTERVENTIONS.map((i) => [i.id, i]));

export function getIntervention(id: string): Intervention | undefined {
  return BY_ID.get(id);
}

export function listInterventions(organ?: OrganId): Intervention[] {
  if (!organ) return [...INTERVENTIONS];
  return INTERVENTIONS.filter((i) => i.organs.includes(organ));
}
