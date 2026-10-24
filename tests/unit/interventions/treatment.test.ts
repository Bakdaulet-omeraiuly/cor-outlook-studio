import { describe, it, expect } from "vitest";
import { heartTreatment, brainTreatment, type LvhInputs } from "@/domain/outlook/treatment";
import { lvMassAse, projectBrain } from "@/domain/outlook/project";
import type { BrainTarget } from "@/domain/outlook/evidence";

// Baseline chosen so LVMI == 135 g/m² (matches the engine golden number in the spec §4.2).
// Solve walls for a target LVM with a fixed cavity/BSA via the shared model.
function inputsForLvmi(lvmi: number, lvidMm = 46, bsaM2 = 1.9): LvhInputs {
  // find equal walls w with lvMassAse(w, lvid, w) == lvmi*bsa
  const target = lvmi * bsaM2;
  let lo = 6, hi = 30;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (lvMassAse(mid, lvidMm, mid) < target) lo = mid;
    else hi = mid;
  }
  const w = (lo + hi) / 2;
  return { ivsMm: w, pwMm: w, lvidMm, bsaM2 };
}

describe("heartTreatment — LVH scenario", () => {
  const inp = inputsForLvmi(135);

  it("baseline LVMI is 135 g/m² (sanity of the test fixture)", () => {
    const lvm = lvMassAse(inp.ivsMm, inp.lvidMm, inp.pwMm);
    expect(lvm / inp.bsaM2).toBeCloseTo(135, 1);
  });

  it("untreated heart is unchanged at every year (no progression modelled)", () => {
    const r = heartTreatment(inp, ["ace_inhibitor_arb"], 5);
    expect(r.untreated.lvmiGm2).toBeCloseTo(135, 1);
    expect(r.untreated.ivsMm).toBeCloseTo(inp.ivsMm, 6);
    expect(r.untreated.pwMm).toBeCloseTo(inp.pwMm, 6);
  });

  it("golden: ACEi + SGLT2 + beta-blocker -> treated LVMI 98.26 at year 5", () => {
    const r = heartTreatment(inp, ["ace_inhibitor_arb", "sglt2_inhibitor", "beta_blocker"], 5);
    expect(r.treated.lvmiGm2).toBeCloseTo(135 * 0.89 * 0.87 * 0.94, 1);
    expect(r.contributors).toEqual(expect.arrayContaining(["ace_inhibitor_arb", "sglt2_inhibitor", "beta_blocker"]));
    expect(r.modelledTimeCourse).toBe(true);
  });

  it("golden: weight loss alone -> treated LVMI 124.2 at year 5", () => {
    const r = heartTreatment(inp, ["weight_loss"], 5);
    expect(r.treated.lvmiGm2).toBeCloseTo(135 * 0.92, 1);
  });

  it("order independent", () => {
    const a = heartTreatment(inp, ["ace_inhibitor_arb", "sglt2_inhibitor"], 5);
    const b = heartTreatment(inp, ["sglt2_inhibitor", "ace_inhibitor_arb"], 5);
    expect(b.treated.lvmiGm2).toBeCloseTo(a.treated.lvmiGm2, 10);
  });

  it("mass-formula inversion round-trip: |ΔLVM| < 0.5 g for the treated walls", () => {
    const r = heartTreatment(inp, ["ace_inhibitor_arb"], 5);
    const reLvm = lvMassAse(r.treated.ivsMm, r.treated.lvidMm, r.treated.pwMm);
    expect(Math.abs(reLvm - r.treated.lvmG)).toBeLessThan(0.5);
    // and the treated LVM matches LVMI*BSA within 0.5 g
    expect(Math.abs(reLvm - r.treated.lvmiGm2 * inp.bsaM2)).toBeLessThan(0.5);
  });

  it("wall floor 6 mm is never breached", () => {
    const thin: LvhInputs = { ivsMm: 7, pwMm: 7, lvidMm: 46, bsaM2: 1.9 };
    const r = heartTreatment(thin, ["ace_inhibitor_arb", "sglt2_inhibitor", "beta_blocker", "weight_loss"], 5);
    expect(r.treated.ivsMm).toBeGreaterThanOrEqual(6);
    expect(r.treated.pwMm).toBeGreaterThanOrEqual(6);
  });

  it("unverified effect (statin) does not change the treated heart", () => {
    const r = heartTreatment(inp, ["statin"], 5);
    expect(r.treated.lvmiGm2).toBeCloseTo(135, 1);
    expect(r.excludedUnverified).toContain("statin:lvmi");
  });
});

describe("brainTreatment — ageing scenario", () => {
  const baseline: Record<BrainTarget, number> = { hippocampus: 7.2, ventricles: 30, cortex: 480 };

  it("no interventions -> treated ratio equals projectBrain(ageing) untreated ratio", () => {
    const r = brainTreatment(baseline, [], 5, "mean");
    const ref = projectBrain(baseline, "aging", 5, "mean");
    for (const t of Object.keys(ref) as BrainTarget[]) {
      expect(r.targets[t].untreatedRatio).toBeCloseTo(ref[t].ratio, 10);
      expect(r.targets[t].treatedRatio).toBeCloseTo(ref[t].ratio, 10);
    }
  });

  it("aerobic exercise raises the treated hippocampus ratio above untreated", () => {
    const r = brainTreatment(baseline, ["aerobic_exercise"], 5, "mean");
    expect(r.targets.hippocampus.treatedRatio).toBeGreaterThan(r.targets.hippocampus.untreatedRatio);
    expect(r.targets.hippocampus.contributors).toContain("aerobic_exercise");
    // cortex + ventricles unchanged vs untreated (no verified effect)
    expect(r.targets.cortex.treatedRatio).toBeCloseTo(r.targets.cortex.untreatedRatio, 10);
    expect(r.targets.ventricles.treatedRatio).toBeCloseTo(r.targets.ventricles.untreatedRatio, 10);
  });

  it("exercise hippocampus effect is ~+2% over the untreated ageing ratio", () => {
    const r = brainTreatment(baseline, ["aerobic_exercise"], 5, "mean");
    const ratio = r.targets.hippocampus.treatedRatio / r.targets.hippocampus.untreatedRatio;
    expect(ratio).toBeCloseTo(1.02, 3);
  });
});
