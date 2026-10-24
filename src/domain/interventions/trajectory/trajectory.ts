import type { OrganId, OrganParameter } from "../organ/types";
import { getOrganModel, clampToBounds } from "../organ/index";
import { getIntervention } from "../catalog/index";
import type { CitationRecord } from "../combine/combine";
import { DEFAULT_SEED, DEFAULT_ITERATIONS, DEFAULT_MAX_RELATIVE_CHANGE } from "../combine/combine";
import type { ParameterEffect, EvidenceGrade } from "../catalog/types";
import { getEffects } from "../effects/index";
import { splitmix32, normal, sdFrom95CI, percentile } from "../util/rng";
import {
  getNaturalCourseRate,
  getNaturalCourse,
  type NaturalCourseModel,
} from "./naturalCourse";

export const DEFAULT_HORIZON_YEARS = 5;

/**
 * Follow-up time (years) at which an intervention's full published effect is
 * assumed to be reached. Effects in src/effects are reported as a single
 * treated-vs-control value at trial follow-up; we do not have a per-year course
 * for them, so we RAMP the relative effect LINEARLY from 0 at year 0 to the
 * full effect at this follow-up, then hold it. This is a modelling assumption
 * (flagged `modelledTimeCourse: true` on every treated trajectory) and is
 * documented in docs/evidence.md. We never invent a measured time course.
 */
export const EFFECT_RAMP_FOLLOWUP_YEARS = 5;

/** Fraction of an intervention's full effect applied at time t (linear ramp, then hold). */
export function rampFraction(years: number, followUp = EFFECT_RAMP_FOLLOWUP_YEARS): number {
  if (years <= 0) return 0;
  if (years >= followUp) return 1;
  return years / followUp;
}

export type Scenario = "untreated" | "treated";

export interface TrajectoryPoint {
  year: number;
  /** central ("likely") value */
  value: number;
  /** Monte Carlo 2.5th / 97.5th percentile. */
  low: number;
  high: number;
  clamped: boolean;
}

export interface ParameterTrajectory {
  id: string;
  label: string;
  unit: string;
  baseline: number;
  direction: OrganParameter["direction"];
  /** Natural-course model used for the untreated arm of this parameter. */
  naturalCourseModel: NaturalCourseModel;
  untreated: TrajectoryPoint[];
  treated: TrajectoryPoint[];
  /** true when a ramp assumption shapes the treated time course. */
  modelledTimeCourse: boolean;
  /** Interventions that contributed a verified effect to this parameter. */
  contributors: string[];
}

export interface TrajectoryResult {
  organ: OrganId;
  years: number[];
  horizonYears: number;
  parameters: ParameterTrajectory[];
  appliedInterventions: { id: string; label: string; kind: "drug" | "lifestyle"; evidenceGrade: EvidenceGrade }[];
  warnings: string[];
  citations: CitationRecord[];
  excludedUnverified: string[];
  naturalCourseScenario: string;
  seed: number;
  iterations: number;
}

export interface TrajectoryOptions {
  organ: OrganId;
  baseline: Record<string, number>;
  interventions: string[];
  horizonYears?: number;
  seed?: number;
  iterations?: number;
  maxRelativeChange?: number;
}

interface Contribution {
  interventionId: string;
  effect: ParameterEffect;
}

/**
 * Compute untreated + treated trajectories over 0..horizon years for every
 * parameter in the organ model that has a baseline.
 *
 * Determinism: central values come from the means; the low/high band comes
 * from a seeded Monte Carlo. The RNG stream is seeded per (parameter) and
 * contributions are processed in id-sorted order, so the result is independent
 * of the order interventions were toggled and reproducible across machines.
 */
export function trajectory(opts: TrajectoryOptions): TrajectoryResult {
  const seed = opts.seed ?? DEFAULT_SEED;
  const iterations = opts.iterations ?? DEFAULT_ITERATIONS;
  const maxRel = opts.maxRelativeChange ?? DEFAULT_MAX_RELATIVE_CHANGE;
  const horizon = opts.horizonYears ?? DEFAULT_HORIZON_YEARS;
  const model = getOrganModel(opts.organ);
  const years = Array.from({ length: horizon + 1 }, (_, i) => i);

  // Resolve interventions (dedupe + mutual exclusion), order-independent.
  const warnings: string[] = [];
  const seenId = new Set<string>();
  const seenClass = new Map<string, string>();
  const applied: TrajectoryResult["appliedInterventions"] = [];
  for (const id of [...opts.interventions].sort()) {
    const iv = getIntervention(id);
    if (!iv) throw new Error(`Unknown intervention: ${id}`);
    if (!iv.organs.includes(opts.organ)) {
      warnings.push(`Intervention "${id}" has no modeled effect for organ "${opts.organ}"; ignored.`);
      continue;
    }
    if (seenId.has(id)) {
      warnings.push(`Duplicate intervention "${id}" ignored (no double-counting).`);
      continue;
    }
    if (iv.exclusiveClass) {
      const existing = seenClass.get(iv.exclusiveClass);
      if (existing) {
        warnings.push(
          `Mutually exclusive: "${id}" shares class "${iv.exclusiveClass}" with "${existing}"; "${id}" not stacked.`,
        );
        continue;
      }
      seenClass.set(iv.exclusiveClass, id);
    }
    seenId.add(id);
    applied.push({ id, label: iv.label, kind: iv.kind, evidenceGrade: iv.evidenceGrade });
  }

  // Collect verified contributions per parameter + provenance.
  const byParameter = new Map<string, Contribution[]>();
  const citations: CitationRecord[] = [];
  const excludedUnverified: string[] = [];
  for (const ai of applied) {
    const effs = getEffects(opts.organ, ai.id);
    if (!effs) continue;
    for (const effect of effs.effects) {
      citations.push({
        ...effect.citation,
        interventionId: ai.id,
        parameterId: effect.parameterId,
        evidenceGrade: effect.evidenceGrade,
        verified: effect.verified,
      });
      if (!effect.verified) {
        excludedUnverified.push(`${ai.id}:${effect.parameterId}`);
        warnings.push(
          `Unverified effect ${ai.id}:${effect.parameterId} excluded from computation` +
            (effect.note ? ` (${effect.note})` : "."),
        );
        continue;
      }
      if (!(effect.parameterId in opts.baseline)) {
        warnings.push(
          `Baseline missing parameter "${effect.parameterId}" required by "${ai.id}"; that effect skipped.`,
        );
        continue;
      }
      const list = byParameter.get(effect.parameterId) ?? [];
      list.push({ interventionId: ai.id, effect });
      byParameter.set(effect.parameterId, list);
    }
  }

  const parameters: ParameterTrajectory[] = [];

  for (const param of model.parameters) {
    const base = opts.baseline[param.id];
    if (base === undefined) continue;

    const nc = getNaturalCourseRate(opts.organ, param.id);
    const ncRate = nc?.ratePerYear ?? 0;
    const ncRange = nc?.ratePerYearRange ?? [0, 0];
    const ncModel: NaturalCourseModel = nc?.model ?? "no-progression";

    const contribs = [...(byParameter.get(param.id) ?? [])].sort((a, b) =>
      a.interventionId < b.interventionId ? -1 : a.interventionId > b.interventionId ? 1 : 0,
    );
    const hasTreatment = contribs.length > 0;
    const modelledTimeCourse = hasTreatment; // ramp assumption shapes treated course

    // Natural-course multiplier at year t for a given per-year rate.
    const ncMul = (rate: number, t: number) => Math.pow(1 + rate, t);

    // Per-contribution ramp fraction at year t, using each effect's own
    // follow-up (falling back to the global default when a source didn't
    // specify one). Linear 0->1 by follow-up, then held.
    const contribFrac = (c: Contribution, t: number) =>
      rampFraction(t, c.effect.followUpYears ?? EFFECT_RAMP_FOLLOWUP_YEARS);

    // Treated multiplier at year t: natural course * ramped intervention product.
    const treatedMeanMul = (t: number) => {
      let m = ncMul(ncRate, t);
      for (const c of contribs) m *= 1 + c.effect.dist.deltaMean * contribFrac(c, t);
      return capMul(m, maxRel).m;
    };

    const untreatedPoints: TrajectoryPoint[] = [];
    const treatedPoints: TrajectoryPoint[] = [];

    for (const t of years) {
      // --- central (deterministic) ---
      const uCentral = clampToBounds(param, base * ncMul(ncRate, t));
      const tCentral = clampToBounds(param, base * treatedMeanMul(t));

      // --- Monte Carlo band (seeded per parameter+year, id-sorted stream) ---
      const rng = splitmix32(seed + hashString(`${param.id}@${t}`));
      const uSamples = new Array<number>(iterations);
      const tSamples = new Array<number>(iterations);
      let uClamp = uCentral.clamped;
      let tClamp = tCentral.clamped;

      for (let i = 0; i < iterations; i++) {
        // Natural-course rate sampled uniformly across its reported spread.
        const rNat = sampleRange(rng, ncRate, ncRange);
        const uMulRaw = ncMul(rNat, t);
        const u = clampToBounds(param, base * uMulRaw);
        if (u.clamped) uClamp = true;
        uSamples[i] = u.value;

        // Treated: same natural course sample * sampled intervention deltas,
        // each ramped by its own follow-up.
        let m = uMulRaw;
        for (const c of contribs) {
          const sd = sdFrom95CI(c.effect.dist.delta95[0], c.effect.dist.delta95[1]);
          const d = normal(rng, c.effect.dist.deltaMean, sd);
          m *= 1 + d * contribFrac(c, t);
        }
        const capped = capMul(m, maxRel);
        const tv = clampToBounds(param, base * capped.m);
        if (tv.clamped || capped.capped) tClamp = true;
        tSamples[i] = tv.value;
      }
      uSamples.sort((a, b) => a - b);
      tSamples.sort((a, b) => a - b);

      untreatedPoints.push({
        year: t,
        value: uCentral.value,
        low: percentile(uSamples, 0.025),
        high: percentile(uSamples, 0.975),
        clamped: uClamp,
      });
      treatedPoints.push({
        year: t,
        value: tCentral.value,
        low: percentile(tSamples, 0.025),
        high: percentile(tSamples, 0.975),
        clamped: tClamp,
      });
    }

    parameters.push({
      id: param.id,
      label: param.label,
      unit: param.unit,
      baseline: base,
      direction: param.direction,
      naturalCourseModel: ncModel,
      untreated: untreatedPoints,
      treated: treatedPoints,
      modelledTimeCourse,
      contributors: [...new Set(contribs.map((c) => c.interventionId))],
    });
  }

  for (const key of Object.keys(opts.baseline)) {
    if (!model.parameters.some((p) => p.id === key)) {
      warnings.push(`Baseline key "${key}" is not a parameter of organ "${opts.organ}"; ignored.`);
    }
  }

  return {
    organ: opts.organ,
    years,
    horizonYears: horizon,
    parameters,
    appliedInterventions: applied,
    warnings,
    citations,
    excludedUnverified,
    naturalCourseScenario: getNaturalCourse(opts.organ).scenarioLabel,
    seed,
    iterations,
  };
}

/** Cap an aggregate multiplier's relative change |m-1| to maxRel. */
function capMul(m: number, maxRel: number): { m: number; capped: boolean } {
  const lo = 1 - maxRel;
  const hi = 1 + maxRel;
  if (m < lo) return { m: lo, capped: true };
  if (m > hi) return { m: hi, capped: true };
  return { m, capped: false };
}

/** Sample a per-year rate uniformly between the reported slow/fast ends (endpoints inclusive). */
function sampleRange(rng: { next(): number }, mean: number, range: [number, number]): number {
  const [a, b] = range;
  if (a === b) return mean;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo + (hi - lo) * rng.next();
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
