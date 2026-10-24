// Ported from cor-outlook-engine tests/trajectory.test.ts (pinned 9cdad09).
// Confirms the vendored engine behaves identically inside this repo.
import { describe, it, expect } from "vitest";
import {
  trajectory,
  rampFraction,
  EFFECT_RAMP_FOLLOWUP_YEARS,
  DEFAULT_HORIZON_YEARS,
} from "@/domain/interventions";

const heartBaseline = { lvmi: 135, lv_wall_thickness: 13, ef: 38, lavi: 40 };
const brainBaseline = { hippocampal_volume: 6.5, cortical_thickness: 2.45, ventricular_volume: 34 };

function paramOf(res: ReturnType<typeof trajectory>, id: string) {
  const p = res.parameters.find((x) => x.id === id);
  if (!p) throw new Error(`no parameter ${id}`);
  return p;
}

describe("vendored engine: trajectory shape", () => {
  it("years 0..5 by default with a point per year per scenario", () => {
    const res = trajectory({ organ: "heart", baseline: heartBaseline, interventions: [] });
    expect(res.horizonYears).toBe(DEFAULT_HORIZON_YEARS);
    expect(res.years).toEqual([0, 1, 2, 3, 4, 5]);
    for (const p of res.parameters) {
      expect(p.untreated).toHaveLength(6);
      expect(p.treated).toHaveLength(6);
    }
  });
});

describe("vendored engine: golden numbers (spec §4.2)", () => {
  it("ACEi + SGLT2 + beta-blocker -> LVMI 98.26 at year 5", () => {
    const res = trajectory({
      organ: "heart",
      baseline: heartBaseline,
      interventions: ["ace_inhibitor_arb", "sglt2_inhibitor", "beta_blocker"],
    });
    expect(paramOf(res, "lvmi").treated[5]!.value).toBeCloseTo(135 * 0.89 * 0.87 * 0.94, 2);
  });

  it("weight loss alone -> LVMI 124.2 at year 5", () => {
    const res = trajectory({ organ: "heart", baseline: heartBaseline, interventions: ["weight_loss"] });
    expect(paramOf(res, "lvmi").treated[5]!.value).toBeCloseTo(135 * 0.92, 1);
  });

  it("shuffled id order -> identical result (20x)", () => {
    const ids = ["ace_inhibitor_arb", "sglt2_inhibitor", "beta_blocker"];
    const ref = trajectory({ organ: "heart", baseline: heartBaseline, interventions: ids });
    for (let i = 0; i < 20; i++) {
      const shuffled = [...ids].sort(() => Math.random() - 0.5);
      const got = trajectory({ organ: "heart", baseline: heartBaseline, interventions: shuffled });
      expect(JSON.stringify(got.parameters)).toEqual(JSON.stringify(ref.parameters));
    }
  });
});

describe("vendored engine: ramp, exclusion, determinism", () => {
  it("rampFraction 0 at year 0, full at follow-up, held after", () => {
    expect(rampFraction(0)).toBe(0);
    expect(rampFraction(EFFECT_RAMP_FOLLOWUP_YEARS)).toBe(1);
    expect(rampFraction(EFFECT_RAMP_FOLLOWUP_YEARS + 3)).toBe(1);
  });

  it("heart untreated is held flat (no progression modelled)", () => {
    const res = trajectory({ organ: "heart", baseline: heartBaseline, interventions: [] });
    const lvmi = paramOf(res, "lvmi");
    expect(lvmi.naturalCourseModel).toBe("no-progression");
    for (const pt of lvmi.untreated) expect(pt.value).toBeCloseTo(135, 6);
  });

  it("unverified effects excluded (statin -> LVMI stays flat)", () => {
    const res = trajectory({ organ: "heart", baseline: heartBaseline, interventions: ["statin"] });
    expect(paramOf(res, "lvmi").treated[5]!.value).toBeCloseTo(135, 6);
    expect(res.excludedUnverified).toContain("statin:lvmi");
  });

  it("duplicate id applied once; mutual exclusion keeps one", () => {
    const twice = trajectory({ organ: "heart", baseline: heartBaseline, interventions: ["ace_inhibitor_arb", "ace_inhibitor_arb"] });
    expect(twice.warnings.some((w) => w.toLowerCase().includes("duplicate"))).toBe(true);
  });

  it("deterministic seed; different seed differs", () => {
    const run = (seed: number) => trajectory({ organ: "brain", baseline: brainBaseline, interventions: ["aerobic_exercise"], seed, iterations: 400 });
    const hv = (r: ReturnType<typeof trajectory>) => paramOf(r, "hippocampal_volume").treated[5]!;
    expect(hv(run(3)).low).toEqual(hv(run(3)).low);
    expect(hv(run(3)).low).not.toEqual(hv(run(4)).low);
  });
});
