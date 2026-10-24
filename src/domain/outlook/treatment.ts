// Treatment scenarios: turn the vendored intervention engine's trajectory into
// the same shapes the existing Outlook 3D consumes — projected heart walls and
// brain target ratios. Pure, deterministic, no React/three. Reuses the existing
// project.ts helpers (lvMassAse, wallsForMass) so there is one mass<->walls model.
//
// Cohort-level only. Untreated heart = today's anatomy unchanged ("no
// progression modelled"): no verified per-year rate of untreated LV structural
// progression exists, so we do not invent one.
import { trajectory, type ParameterTrajectory, type TrajectoryResult } from "@/domain/interventions";
import type { BrainTarget } from "./evidence";
import { lvMassAse, wallsForMass, projectBrain, type BrainProjection, type Pace } from "./project";

export const TX_HORIZON_YEARS = 5;
export const TX_SEED = 1;
export const TX_ITERATIONS = 2000;

export interface LvhInputs {
  ivsMm: number;
  pwMm: number;
  lvidMm: number;
  bsaM2: number;
}

/** One scenario's heart state at the chosen year. */
export interface HeartTreatmentState {
  ivsMm: number;
  pwMm: number;
  lvidMm: number;
  lvmG: number;
  lvmiGm2: number;
  /** central LVMI range (best/worst) at this year, g/m². */
  lvmiRange: [number, number];
  clamped: boolean;
}

export interface HeartTreatmentResult {
  untreated: HeartTreatmentState;
  treated: HeartTreatmentState;
  /** engine provenance passed straight through to the UI. */
  result: TrajectoryResult;
  /** interventions that contributed a verified LVMI effect. */
  contributors: string[];
  modelledTimeCourse: boolean;
  warnings: string[];
  excludedUnverified: string[];
}

function lvmiPoint(p: ParameterTrajectory, scenario: "untreated" | "treated", year: number) {
  const series = scenario === "treated" ? p.treated : p.untreated;
  const i = Math.max(0, Math.min(series.length - 1, year));
  return series[i]!;
}

/** Invert an LVMI (g/m²) to septal/posterior walls with cavity held (same model as projectLvh). */
function wallsForLvmi(inp: LvhInputs, lvmiGm2: number): { ivsMm: number; pwMm: number; lvmG: number; clamped: boolean } {
  const targetG = lvmiGm2 * inp.bsaM2;
  const w = wallsForMass(inp.ivsMm, inp.lvidMm, inp.pwMm, targetG);
  const lvmG = lvMassAse(w.ivsMm, inp.lvidMm, w.pwMm);
  // wallsForMass enforces the 6 mm floor; detect when the floor bound bound.
  const clamped = Math.abs(lvmG - targetG) > 0.5;
  return { ivsMm: w.ivsMm, pwMm: w.pwMm, lvmG, clamped };
}

/**
 * Heart treatment outlook for the LVH scenario.
 * - untreated: walls unchanged (no progression modelled) at every year.
 * - treated: engine LVMI(t) -> LVM -> walls via the shared ASE model.
 */
export function heartTreatment(
  inp: LvhInputs,
  interventionIds: string[],
  years: number,
  opts: { seed?: number; iterations?: number } = {},
): HeartTreatmentResult {
  const lvm0 = lvMassAse(inp.ivsMm, inp.lvidMm, inp.pwMm);
  const lvmi0 = lvm0 / inp.bsaM2;

  const result = trajectory({
    organ: "heart",
    baseline: {
      lvmi: lvmi0,
      lv_wall_thickness: (inp.ivsMm + inp.pwMm) / 2,
      // EF/LAVI are not driven here; omit so the engine reports only what we feed.
    },
    interventions: interventionIds,
    horizonYears: TX_HORIZON_YEARS,
    seed: opts.seed ?? TX_SEED,
    iterations: opts.iterations ?? TX_ITERATIONS,
  });

  const lvmiParam = result.parameters.find((p) => p.id === "lvmi");

  // Untreated = today's walls unchanged.
  const untreated: HeartTreatmentState = {
    ivsMm: inp.ivsMm,
    pwMm: inp.pwMm,
    lvidMm: inp.lvidMm,
    lvmG: lvm0,
    lvmiGm2: lvmi0,
    lvmiRange: [lvmi0, lvmi0],
    clamped: false,
  };

  let treated: HeartTreatmentState = { ...untreated };
  let contributors: string[] = [];
  let modelledTimeCourse = false;

  if (lvmiParam) {
    const pt = lvmiPoint(lvmiParam, "treated", years);
    const w = wallsForLvmi(inp, pt.value);
    const loW = wallsForLvmi(inp, Math.min(pt.low, pt.high));
    const hiW = wallsForLvmi(inp, Math.max(pt.low, pt.high));
    treated = {
      ivsMm: w.ivsMm,
      pwMm: w.pwMm,
      lvidMm: inp.lvidMm,
      lvmG: w.lvmG,
      lvmiGm2: pt.value,
      lvmiRange: [loW.lvmG / inp.bsaM2, hiW.lvmG / inp.bsaM2],
      clamped: w.clamped || pt.clamped,
    };
    contributors = lvmiParam.contributors;
    modelledTimeCourse = lvmiParam.modelledTimeCourse;
  }

  return {
    untreated,
    treated,
    result,
    contributors,
    modelledTimeCourse,
    warnings: result.warnings,
    excludedUnverified: result.excludedUnverified,
  };
}

// ---------------------------------------------------------------- brain

export interface BrainTreatmentTarget {
  target: BrainTarget;
  untreatedRatio: number;
  treatedRatio: number;
  baselineMl: number;
  untreatedMl: number;
  treatedMl: number;
  /** verified intervention ids contributing to this target (empty = untreated==treated). */
  contributors: string[];
}

export interface BrainTreatmentResult {
  targets: Record<BrainTarget, BrainTreatmentTarget>;
  warnings: string[];
  excludedUnverified: string[];
  modelledTimeCourse: boolean;
}

/**
 * Brain treatment outlook (ageing scenario).
 * - untreated ratio: COR Studio's own projectBrain(ageing) — the single source of truth.
 * - treated ratio: untreated × Π(1 + e_i·r_i(years)) using only verified engine effects
 *   for that target (currently aerobic exercise → hippocampus). Targets with no verified
 *   effect keep the untreated ratio.
 */
export function brainTreatment(
  baseline: Record<BrainTarget, number>,
  interventionIds: string[],
  years: number,
  pace: Pace,
  opts: { seed?: number; iterations?: number } = {},
): BrainTreatmentResult {
  const untreated = projectBrain(baseline, "aging", years, pace);

  const result = trajectory({
    organ: "brain",
    baseline: {
      hippocampal_volume: baseline.hippocampus,
      cortical_thickness: baseline.cortex, // used only for engine's own natural course; we keep projectBrain as truth
      ventricular_volume: baseline.ventricles,
    },
    interventions: interventionIds,
    horizonYears: TX_HORIZON_YEARS,
    seed: opts.seed ?? TX_SEED,
    iterations: opts.iterations ?? TX_ITERATIONS,
  });

  // Map engine parameter id -> studio BrainTarget.
  const paramToTarget: Record<string, BrainTarget> = {
    hippocampal_volume: "hippocampus",
    ventricular_volume: "ventricles",
    cortical_thickness: "cortex",
  };

  // Treated/untreated multiplier the engine applied per parameter (treated/untreated at `years`),
  // which isolates the intervention effect from the (duplicated) natural course.
  const effectMultiplier: Partial<Record<BrainTarget, { mul: number; contributors: string[]; modelled: boolean }>> = {};
  for (const p of result.parameters) {
    const target = paramToTarget[p.id];
    if (!target) continue;
    const i = Math.max(0, Math.min(p.treated.length - 1, years));
    const u = p.untreated[i]!.value;
    const t = p.treated[i]!.value;
    const mul = u !== 0 ? t / u : 1;
    effectMultiplier[target] = { mul, contributors: p.contributors, modelled: p.modelledTimeCourse };
  }

  const targets = {} as Record<BrainTarget, BrainTreatmentTarget>;
  let anyModelled = false;
  for (const target of Object.keys(untreated) as BrainTarget[]) {
    const u: BrainProjection = untreated[target];
    const eff = effectMultiplier[target];
    const mul = eff?.mul ?? 1;
    if (eff?.modelled && eff.contributors.length > 0) anyModelled = true;
    const treatedRatio = u.ratio * mul;
    targets[target] = {
      target,
      untreatedRatio: u.ratio,
      treatedRatio,
      baselineMl: u.baselineMl,
      untreatedMl: u.projectedMl,
      treatedMl: u.baselineMl * treatedRatio,
      contributors: eff?.contributors ?? [],
    };
  }

  return {
    targets,
    warnings: result.warnings,
    excludedUnverified: result.excludedUnverified,
    modelledTimeCourse: anyModelled,
  };
}
