export type OrganId = "heart" | "brain";

/**
 * Whether a higher value of a parameter is clinically better, worse, or
 * neutral. Used by downstream display only; it does NOT affect the math.
 */
export type Direction = "higher-better" | "higher-worse" | "neutral";

export interface OrganParameter {
  id: string;
  label: string;
  unit: string;
  /** Physiological plausibility bounds [min, max]; computed values clamp here. */
  bounds: [number, number];
  direction: Direction;
}

export interface OrganModel {
  id: OrganId;
  label: string;
  parameters: OrganParameter[];
}
