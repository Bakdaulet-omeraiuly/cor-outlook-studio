import type { OrganId } from "../organ/types";
import type { CombineResult } from "../combine/combine";
import {
  ContractSchema,
  SCHEMA_VERSION,
  COHORT_NOTICE,
  type Contract,
} from "./schema";

export const ENGINE_VERSION = "0.1.0";

/**
 * Build a validated contract from a combine() result. Validation failure is a
 * programming error and throws (the engine must only emit valid contracts).
 */
export function buildContract(
  organ: OrganId,
  result: CombineResult,
): Contract {
  const draft = {
    schemaVersion: SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    organ,
    notice: COHORT_NOTICE,
    parameters: result.parameters,
    appliedInterventions: result.appliedInterventions,
    warnings: result.warnings,
    provenance: {
      seed: result.seed,
      iterations: result.iterations,
      citations: result.citations,
      excludedUnverified: result.excludedUnverified,
    },
  };

  const parsed = ContractSchema.safeParse(draft);
  if (!parsed.success) {
    throw new Error(
      `Internal error: produced contract failed schema validation: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
