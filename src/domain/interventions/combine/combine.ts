import type { OrganId, OrganParameter } from "../organ/types";
import { getOrganModel, clampToBounds } from "../organ/index";
import { getIntervention } from "../catalog/index";
import type { Citation, EvidenceGrade, ParameterEffect } from "../catalog/types";
import { getEffects } from "../effects/index";
import { splitmix32, normal, sdFrom95CI, percentile } from "../util/rng";
import { findInteraction, INTERACTIONS } from "./interactions";

/** Maximum aggregate relative change |M - 1| per parameter before capping. */
export const DEFAULT_MAX_RELATIVE_CHANGE = 0.6;
export const DEFAULT_SEED = 1;
export const DEFAULT_ITERATIONS = 2000;

export interface AppliedIntervention {
  id: string;
  label: string;
  kind: "drug" | "lifestyle";
  evidenceGrade: EvidenceGrade;
}

export interface CitationRecord extends Citation {
  interventionId: string;
  parameterId: string;
  evidenceGrade: EvidenceGrade;
  verified: boolean;
}

export interface ParameterResult {
  id: string;
  label: string;
  unit: string;
  baseline: number;
  value: number;
  low: number;
  high: number;
  direction: OrganParameter["direction"];
  clamped: boolean;
}

export interface CombineResult {
  parameters: ParameterResult[];
  appliedInterventions: AppliedIntervention[];
  warnings: string[];
  citations: CitationRecord[];
  excludedUnverified: string[];
  seed: number;
  iterations: number;
}

export interface CombineOptions {
  organ: OrganId;
  baseline: Record<string, number>;
  interventions: string[];
  seed?: number;
  iterations?: number;
  maxRelativeChange?: number;
}

/** A single verified effect contribution bound to its source intervention. */
interface Contribution {
  interventionId: string;
  effect: ParameterEffect;
}

/**
 * Resolve requested interventions: validate, de-duplicate by id, enforce
 * mutual exclusion by exclusiveClass. Returns the kept list (order-independent:
 * sorted by id) plus warnings.
 */
function resolveInterventions(
  organ: OrganId,
  interventionIds: string[],
): { applied: AppliedIntervention[]; warnings: string[] } {
  const warnings: string[] = [];
  const seenId = new Set<string>();
  const seenClass = new Map<string, string>(); // class -> first intervention id
  const applied: AppliedIntervention[] = [];

  // Sort for order independence before dedupe/exclusion decisions.
  const sortedIds = [...interventionIds].sort();

  for (const id of sortedIds) {
    const iv = getIntervention(id);
    if (!iv) {
      throw new Error(`Unknown intervention: ${id}`);
    }
    if (!iv.organs.includes(organ)) {
      warnings.push(
        `Intervention "${id}" has no modeled effect for organ "${organ}"; ignored.`,
      );
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
          `Mutually exclusive: "${id}" shares class "${iv.exclusiveClass}" with ` +
            `"${existing}"; "${id}" not stacked.`,
        );
        continue;
      }
      seenClass.set(iv.exclusiveClass, id);
    }
    seenId.add(id);
    applied.push({
      id,
      label: iv.label,
      kind: iv.kind,
      evidenceGrade: iv.evidenceGrade,
    });
  }
  return { applied, warnings };
}

/**
 * Gather verified effect contributions per parameter, and record provenance
 * for every effect (verified or not).
 */
function collectContributions(
  organ: OrganId,
  applied: AppliedIntervention[],
  baseline: Record<string, number>,
): {
  byParameter: Map<string, Contribution[]>;
  citations: CitationRecord[];
  excludedUnverified: string[];
  warnings: string[];
} {
  const byParameter = new Map<string, Contribution[]>();
  const citations: CitationRecord[] = [];
  const excludedUnverified: string[] = [];
  const warnings: string[] = [];

  for (const ai of applied) {
    const effs = getEffects(organ, ai.id);
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
        const tag = `${ai.id}:${effect.parameterId}`;
        excludedUnverified.push(tag);
        warnings.push(
          `Unverified effect ${tag} excluded from computation` +
            (effect.note ? ` (${effect.note})` : "."),
        );
        continue;
      }

      if (!(effect.parameterId in baseline)) {
        warnings.push(
          `Baseline missing parameter "${effect.parameterId}" required by ` +
            `"${ai.id}"; that effect skipped.`,
        );
        continue;
      }

      const list = byParameter.get(effect.parameterId) ?? [];
      list.push({ interventionId: ai.id, effect });
      byParameter.set(effect.parameterId, list);
    }
  }
  return { byParameter, citations, excludedUnverified, warnings };
}

/**
 * Compute the combined multiplier for a parameter from a set of relative
 * deltas (one per contribution, already sampled or mean), applying any cited
 * interaction terms once per applied pair, then capping |M-1|.
 */
function combineMultiplier(
  contributions: Contribution[],
  deltas: number[],
  interactionDeltas: number[],
  maxRelativeChange: number,
): { multiplier: number; capped: boolean } {
  let m = 1;
  for (const d of deltas) m *= 1 + d;
  for (const d of interactionDeltas) m *= 1 + d;

  let capped = false;
  const lowerBound = 1 - maxRelativeChange;
  const upperBound = 1 + maxRelativeChange;
  if (m < lowerBound) {
    m = lowerBound;
    capped = true;
  } else if (m > upperBound) {
    m = upperBound;
    capped = true;
  }
  // Reference contributions to keep signature meaningful for callers/tests.
  void contributions;
  return { multiplier: m, capped };
}

/** Interaction terms active for a parameter given the applied intervention set. */
function activeInteractions(
  appliedIds: string[],
  parameterId: string,
): { deltaMean: number; delta95: [number, number] }[] {
  const out: { deltaMean: number; delta95: [number, number] }[] = [];
  if (INTERACTIONS.length === 0) return out;
  for (let i = 0; i < appliedIds.length; i++) {
    for (let j = i + 1; j < appliedIds.length; j++) {
      const term = findInteraction(
        appliedIds[i] as string,
        appliedIds[j] as string,
        parameterId,
      );
      if (term) out.push({ deltaMean: term.deltaMean, delta95: term.delta95 });
    }
  }
  return out;
}

export function combine(opts: CombineOptions): CombineResult {
  const seed = opts.seed ?? DEFAULT_SEED;
  const iterations = opts.iterations ?? DEFAULT_ITERATIONS;
  const maxRel = opts.maxRelativeChange ?? DEFAULT_MAX_RELATIVE_CHANGE;
  const model = getOrganModel(opts.organ);

  const { applied, warnings: resolveWarnings } = resolveInterventions(
    opts.organ,
    opts.interventions,
  );
  const appliedIds = applied.map((a) => a.id); // already sorted by id

  const { byParameter, citations, excludedUnverified, warnings: collectWarnings } =
    collectContributions(opts.organ, applied, opts.baseline);

  const warnings = [...resolveWarnings, ...collectWarnings];
  const parameters: ParameterResult[] = [];

  for (const param of model.parameters) {
    const baseVal = opts.baseline[param.id];
    if (baseVal === undefined) continue; // not provided -> not reported

    const contribs = byParameter.get(param.id) ?? [];
    const interactions = activeInteractions(appliedIds, param.id);

    // --- Central (deterministic) estimate from means ---
    const meanDeltas = contribs.map((c) => c.effect.dist.deltaMean);
    const meanInteractionDeltas = interactions.map((t) => t.deltaMean);
    const central = combineMultiplier(
      contribs,
      meanDeltas,
      meanInteractionDeltas,
      maxRel,
    );
    const centralClamp = clampToBounds(param, baseVal * central.multiplier);

    // --- Monte Carlo over the 95% CIs (seeded, order-independent) ---
    // Deterministic stream order: sort contributions by intervention id then
    // parameter id so stream assignment is independent of input order.
    const orderedContribs = [...contribs].sort((a, b) =>
      a.interventionId < b.interventionId ? -1 : a.interventionId > b.interventionId ? 1 : 0,
    );
    const rng = splitmix32(seed + hashString(param.id));
    const samples: number[] = new Array(iterations);
    let anyClamp = centralClamp.clamped || central.capped;

    for (let it = 0; it < iterations; it++) {
      const sampledDeltas = orderedContribs.map((c) => {
        const sd = sdFrom95CI(c.effect.dist.delta95[0], c.effect.dist.delta95[1]);
        return normal(rng, c.effect.dist.deltaMean, sd);
      });
      const sampledInteractions = interactions.map((t) => {
        const sd = sdFrom95CI(t.delta95[0], t.delta95[1]);
        return normal(rng, t.deltaMean, sd);
      });
      const m = combineMultiplier(
        orderedContribs,
        sampledDeltas,
        sampledInteractions,
        maxRel,
      );
      const clamped = clampToBounds(param, baseVal * m.multiplier);
      if (clamped.clamped || m.capped) anyClamp = true;
      samples[it] = clamped.value;
    }
    samples.sort((a, b) => a - b);
    const low = percentile(samples, 0.025);
    const high = percentile(samples, 0.975);

    parameters.push({
      id: param.id,
      label: param.label,
      unit: param.unit,
      baseline: baseVal,
      value: centralClamp.value,
      low,
      high,
      direction: param.direction,
      clamped: anyClamp,
    });

    if (central.capped) {
      warnings.push(
        `Parameter "${param.id}" hit the aggregate relative-change cap ` +
          `(|M-1| > ${maxRel}); result is capped, not an extrapolation.`,
      );
    }
    if (centralClamp.clamped) {
      warnings.push(
        `Parameter "${param.id}" central value clamped to physiological bounds.`,
      );
    }
  }

  // Warn about baseline keys that are not part of the organ model.
  for (const key of Object.keys(opts.baseline)) {
    if (!model.parameters.some((p) => p.id === key)) {
      warnings.push(`Baseline key "${key}" is not a parameter of organ "${opts.organ}"; ignored.`);
    }
  }

  return {
    parameters,
    appliedInterventions: applied,
    warnings,
    citations,
    excludedUnverified,
    seed,
    iterations,
  };
}

/** Small deterministic string hash to offset the RNG per parameter. */
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
