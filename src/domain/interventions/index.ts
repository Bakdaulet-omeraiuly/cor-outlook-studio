import type { OrganId } from "./organ/types";
import { getOrganModel, isOrganId } from "./organ/index";
import { listInterventions as catalogList } from "./catalog/index";
import { getEffects } from "./effects/index";
import { combine } from "./combine/combine";
import { buildContract } from "./contract/build";
import type { Contract } from "./contract/schema";
import type { InterventionEffects } from "./catalog/types";

export type { OrganId, OrganModel, OrganParameter, Direction } from "./organ/types";
export type {
  Intervention,
  InterventionEffects,
  ParameterEffect,
  Citation,
  EvidenceGrade,
} from "./catalog/types";
export type { Contract } from "./contract/schema";
export { SCHEMA_VERSION, COHORT_NOTICE, ContractSchema } from "./contract/schema";
export { ENGINE_VERSION } from "./contract/build";
export { getOrganModel, isOrganId } from "./organ/index";
export { listInterventions } from "./catalog/index";

// Time-trajectory API (0-N year untreated vs treated outlook).
export {
  trajectory,
  rampFraction,
  DEFAULT_HORIZON_YEARS,
  EFFECT_RAMP_FOLLOWUP_YEARS,
} from "./trajectory/trajectory";
export type {
  TrajectoryResult,
  TrajectoryOptions,
  ParameterTrajectory,
  TrajectoryPoint,
  Scenario,
} from "./trajectory/trajectory";
export {
  getNaturalCourse,
  getNaturalCourseRate,
} from "./trajectory/naturalCourse";
export type {
  NaturalCourse,
  NaturalCourseRate,
  NaturalCourseModel,
} from "./trajectory/naturalCourse";

export interface SimulateInput {
  organ: OrganId;
  /** parameterId -> baseline value, in the parameter's unit. */
  baseline: Record<string, number>;
  interventions: string[];
  /** Deterministic Monte Carlo seed (default 1). */
  seed?: number;
  /** Monte Carlo iterations (default 2000). */
  iterations?: number;
}

/**
 * Run a cohort-level organ-outlook simulation and return a validated contract.
 *
 * The result is cohort-level decision support, NOT an individual prediction;
 * see `contract.notice`.
 */
export function simulate(input: SimulateInput): Contract {
  if (!isOrganId(input.organ)) {
    throw new Error(`Unknown organ: ${String(input.organ)}`);
  }
  const result = combine({
    organ: input.organ,
    baseline: input.baseline,
    interventions: input.interventions,
    ...(input.seed !== undefined ? { seed: input.seed } : {}),
    ...(input.iterations !== undefined ? { iterations: input.iterations } : {}),
  });
  return buildContract(input.organ, result);
}

/** Re-export for convenience alongside the catalog list. */
export function getModel(organ: OrganId) {
  return getOrganModel(organ);
}

/**
 * Read-only lookup of an intervention's effects for an organ, including
 * citations, population, evidence grade, and verified/unverified status.
 * Returns undefined if the intervention has no entry for that organ.
 *
 * Exposed so UIs can render provenance (ⓘ popovers) and detect whether an
 * intervention has any sourced (verified) effect for the selected organ.
 */
export function getInterventionEffects(
  organ: OrganId,
  interventionId: string,
): InterventionEffects | undefined {
  return getEffects(organ, interventionId);
}

export const catalog = { listInterventions: catalogList };
