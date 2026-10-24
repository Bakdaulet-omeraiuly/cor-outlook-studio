import { z } from "zod";

export const SCHEMA_VERSION = "0.1.0";

export const COHORT_NOTICE =
  "Cohort-level estimate derived from published trial/meta-analysis data. " +
  "This is NOT a prediction for an individual patient. For clinician decision " +
  "support only.";

export const DirectionSchema = z.enum([
  "higher-better",
  "higher-worse",
  "neutral",
]);

export const EvidenceGradeSchema = z.enum(["A", "B", "C"]);

export const ParameterResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  unit: z.string(),
  baseline: z.number(),
  value: z.number(),
  low: z.number(),
  high: z.number(),
  direction: DirectionSchema,
  clamped: z.boolean(),
});

export const AppliedInterventionSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["drug", "lifestyle"]),
  evidenceGrade: EvidenceGradeSchema,
});

export const CitationRecordSchema = z.object({
  authors: z.string(),
  year: z.number(),
  journal: z.string(),
  doi: z.string().optional(),
  trial: z.string().optional(),
  interventionId: z.string(),
  parameterId: z.string(),
  evidenceGrade: EvidenceGradeSchema,
  verified: z.boolean(),
});

export const ProvenanceSchema = z.object({
  seed: z.number(),
  iterations: z.number().int().positive(),
  citations: z.array(CitationRecordSchema),
  excludedUnverified: z.array(z.string()),
});

export const ContractSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  engineVersion: z.string(),
  organ: z.enum(["heart", "brain"]),
  notice: z.string(),
  parameters: z.array(ParameterResultSchema),
  appliedInterventions: z.array(AppliedInterventionSchema),
  warnings: z.array(z.string()),
  provenance: ProvenanceSchema,
});

export type Contract = z.infer<typeof ContractSchema>;
