import type { OrganModel } from "./types";

/**
 * Brain structural parameters. Bounds are broad plausibility limits for
 * clamping only. Volumes in cm^3, thickness in mm.
 */
export const brainModel: OrganModel = {
  id: "brain",
  label: "Brain",
  parameters: [
    {
      id: "hippocampal_volume",
      label: "Hippocampal volume (total)",
      unit: "cm^3",
      bounds: [3, 10],
      direction: "higher-better",
    },
    {
      id: "cortical_thickness",
      label: "Mean cortical thickness",
      unit: "mm",
      bounds: [1.5, 3.5],
      direction: "higher-better",
    },
    {
      id: "ventricular_volume",
      label: "Lateral ventricular volume",
      unit: "cm^3",
      bounds: [5, 80],
      direction: "higher-worse",
    },
  ],
};
