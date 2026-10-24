import type { OrganId } from "../organ/types";
import type { Citation } from "../catalog/types";

/**
 * Natural-course ("untreated") progression rates, used to build the
 * UNTREATED trajectory a treatment scenario is compared against.
 *
 * Every rate is a cohort-level, cited annual change. Rates are expressed as a
 * RELATIVE change per year on a parameter: value(t) = value0 * (1 + r)^t,
 * where r is `ratePerYear` (a fraction; -0.0466 = 4.66%/year loss).
 *
 * HARD RULE: no number without a citation. Where no defensible single cohort
 * rate exists (notably untreated structural LV progression), the parameter is
 * marked `modelled: "no-progression"` and held flat — NOT invented.
 */

export type NaturalCourseModel = "cited-rate" | "no-progression";

export interface NaturalCourseRate {
  parameterId: string;
  /** Relative change per year (fraction). 0 when model is "no-progression". */
  ratePerYear: number;
  /** Slower / faster ends of the reported spread (relative per year). */
  ratePerYearRange: [number, number];
  model: NaturalCourseModel;
  citation: Citation;
  /** What the source actually measured, when not identical to this parameter. */
  caveat?: string;
  note?: string;
}

export interface NaturalCourse {
  /** Human label of the natural-course cohort assumed when untreated. */
  scenarioLabel: string;
  rates: NaturalCourseRate[];
}

// --- Brain: typical ageing (cognitively normal older adults) ---------------
// These are the same cohort-level rates COR Studio uses in its Outlook screen.
const brainNaturalCourse: NaturalCourse = {
  scenarioLabel: "Typical ageing (cognitively normal older adults, ~60-90 y)",
  rates: [
    {
      parameterId: "hippocampal_volume",
      ratePerYear: -0.0141,
      ratePerYearRange: [-0.0052, -0.023],
      model: "cited-rate",
      citation: {
        authors: "Barnes J, Bartlett JW, van de Pol LA, et al.",
        year: 2009,
        journal: "Neurobiol Aging 30:1711-1723",
        doi: "10.1016/j.neurobiolaging.2008.01.010",
      },
      caveat:
        "Meta-analysis of hippocampal atrophy rates; control (non-AD) arm used " +
        "for typical ageing. Range is the 95% CI of the cohort mean.",
    },
    {
      parameterId: "cortical_thickness",
      ratePerYear: -0.005,
      ratePerYearRange: [-0.005, -0.005],
      model: "cited-rate",
      citation: {
        authors: "Fjell AM, Walhovd KB, Fennema-Notestine C, et al.",
        year: 2009,
        journal: "J Neurosci 29:15223-15231",
        doi: "10.1523/JNEUROSCI.3252-09.2009",
      },
      caveat:
        "~0.5%/year in temporal and prefrontal cortex in healthy ageing; applied " +
        "here to mean cortical thickness. No spread reported.",
    },
    {
      parameterId: "ventricular_volume",
      ratePerYear: 0.02,
      ratePerYearRange: [0.02, 0.02],
      model: "cited-rate",
      citation: {
        authors: "de Leon MJ, George AE, Reisberg B, et al.",
        year: 1989,
        journal: "AJR Am J Roentgenol 152:1257-1262",
        doi: "10.2214/ajr.152.6.1257",
      },
      caveat:
        "~2%/year ventricular enlargement in normal ageing, measured on CT. " +
        "No spread reported.",
    },
  ],
};

// --- Heart: untreated hypertensive LVH -------------------------------------
// No single defensible cohort rate exists for untreated LV mass / wall
// progression over 0-5 y (the literature reports heterogeneous trajectory
// classes and short, mixed cohorts). Per the no-invention rule, the untreated
// heart is held FLAT and labelled "no progression modelled".
const heartNaturalCourse: NaturalCourse = {
  scenarioLabel: "Untreated — no progression modelled (see note)",
  rates: [
    noProgression(
      "lvmi",
      "No single defensible cohort rate for untreated LV-mass-index progression " +
        "over 0-5 y; held flat rather than inventing a rate.",
    ),
    noProgression(
      "lv_wall_thickness",
      "No single defensible cohort rate for untreated LV-wall-thickness " +
        "progression; held flat rather than inventing a rate.",
    ),
    noProgression(
      "ef",
      "Untreated EF trajectory is condition-dependent and not a single cohort " +
        "rate; held flat.",
    ),
    noProgression(
      "lavi",
      "No defensible single cohort rate for untreated LA-volume-index change; " +
        "held flat.",
    ),
  ],
};

function noProgression(parameterId: string, note: string): NaturalCourseRate {
  return {
    parameterId,
    ratePerYear: 0,
    ratePerYearRange: [0, 0],
    model: "no-progression",
    citation: { authors: "n/a (no progression modelled)", year: 0, journal: "n/a" },
    note,
  };
}

const BY_ORGAN: Record<OrganId, NaturalCourse> = {
  heart: heartNaturalCourse,
  brain: brainNaturalCourse,
};

export function getNaturalCourse(organ: OrganId): NaturalCourse {
  return BY_ORGAN[organ];
}

export function getNaturalCourseRate(
  organ: OrganId,
  parameterId: string,
): NaturalCourseRate | undefined {
  return BY_ORGAN[organ].rates.find((r) => r.parameterId === parameterId);
}
