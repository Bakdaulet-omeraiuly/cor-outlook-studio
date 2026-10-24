import { clamp } from "../util/rng";
import { brainModel } from "./brain";
import { heartModel } from "./heart";
import type { OrganId, OrganModel, OrganParameter } from "./types";

export type { OrganId, OrganModel, OrganParameter, Direction } from "./types";

const MODELS: Record<OrganId, OrganModel> = {
  heart: heartModel,
  brain: brainModel,
};

export function getOrganModel(organ: OrganId): OrganModel {
  const m = MODELS[organ];
  if (!m) throw new Error(`Unknown organ: ${organ}`);
  return m;
}

export function isOrganId(x: string): x is OrganId {
  return x === "heart" || x === "brain";
}

export function getParameter(
  organ: OrganId,
  parameterId: string,
): OrganParameter | undefined {
  return getOrganModel(organ).parameters.find((p) => p.id === parameterId);
}

/** Clamp a value to a parameter's bounds; returns value + whether it clamped. */
export function clampToBounds(
  param: OrganParameter,
  value: number,
): { value: number; clamped: boolean } {
  const clamped = clamp(value, param.bounds[0], param.bounds[1]);
  return { value: clamped, clamped: clamped !== value };
}
