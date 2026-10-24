// Spec §3: one source of truth. The vendored engine's natural-course (ageing)
// rates MUST equal COR Studio's own evidence.ts ageing rates, so the untreated
// brain arm is identical whether drawn from projectBrain or the engine.
// If these ever diverge, this test fails and the discrepancy must be resolved.
import { describe, it, expect } from "vitest";
import { getNaturalCourseRate } from "@/domain/interventions";
import { BRAIN_SCENARIOS } from "@/domain/outlook/evidence";

const ageing = BRAIN_SCENARIOS.aging.rates;

// evidence.ts stores % per year; the engine stores the same as a fraction.
const pairs: { param: string; evidencePct: number }[] = [
  { param: "hippocampal_volume", evidencePct: ageing.hippocampus.mean },
  { param: "cortical_thickness", evidencePct: ageing.cortex.mean },
  { param: "ventricular_volume", evidencePct: ageing.ventricles.mean },
];

describe("engine natural-course == evidence.ts ageing", () => {
  for (const { param, evidencePct } of pairs) {
    it(`${param}: engine fraction equals evidence.ts ${evidencePct}%/y`, () => {
      const rate = getNaturalCourseRate("brain", param);
      expect(rate, `engine has a rate for ${param}`).toBeDefined();
      expect(rate!.ratePerYear).toBeCloseTo(evidencePct / 100, 6);
    });
  }
});
