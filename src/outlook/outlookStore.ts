"use client";
// Outlook view state (session-only): open/closed, time horizon, pace and per-organ scenario inputs.
import { create } from "zustand";
import type { BrainScenarioId, LvhArm } from "@/domain/outlook/evidence";
import type { Pace } from "@/domain/outlook/project";

export interface OutlookState {
  open: boolean;
  years: number;
  pace: Pace;
  brainScenario: BrainScenarioId;
  /** Heart: today's values typed by the user when the record has none (null = use the record). */
  avaOverride: number | null;
  vmaxOverride: number | null;
  heartScenario: HeartScenario;
  lvhArm: LvhArm;
  /** LVH inputs typed by the user (mm, m²); missing keys fall back to the record. */
  lvhOverrides: Partial<Record<"ivsMm" | "pwMm" | "lvidMm" | "bsaM2", number>>;
  // ---- Treatment scenarios (interventions) ----
  /** Currently toggled intervention ids (cumulative, order-independent). */
  interventionIds: string[];
  /** 3D comparison layout for the treatment scenario. */
  viewMode: ViewMode;
  /** Assistant hook: ids to highlight with a subtle ring (also read from ?suggest=). No chat here. */
  suggestedInterventionIds: string[];
  set: (patch: Partial<Omit<OutlookState, "set">>) => void;
}

/** "tx" = the treatment-scenario (interventions) view added by this feature. */
export type HeartScenario = "as" | "lvh" | "tx";
export type ViewMode = "side" | "ghost";

export const MAX_YEARS = 10;
/** The treatment scenario is fixed to a 0-5 year horizon. */
export const TX_MAX_YEARS = 5;

/** Default preset so the first screen already shows a treated-vs-untreated difference (spec §6.2). */
export const DEFAULT_HEART_PRESET = ["ace_inhibitor_arb", "sglt2_inhibitor"];
export const DEFAULT_BRAIN_PRESET = ["aerobic_exercise"];

export const useOutlook = create<OutlookState>((set) => ({
  open: false,
  years: 5,
  pace: "mean",
  brainScenario: "alzheimers",
  avaOverride: null,
  vmaxOverride: null,
  heartScenario: "tx",
  lvhArm: "losartan",
  lvhOverrides: {},
  interventionIds: [...DEFAULT_HEART_PRESET],
  viewMode: "side",
  suggestedInterventionIds: [],
  set: (patch) => set(patch),
}));
