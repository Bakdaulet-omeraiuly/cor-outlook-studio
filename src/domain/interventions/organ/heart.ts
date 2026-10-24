import type { OrganModel } from "./types";

/**
 * Heart structural/functional parameters. Bounds are broad physiological
 * plausibility limits (not reference ranges) used only to clamp computed
 * values. Units follow common echocardiography / CMR conventions.
 */
export const heartModel: OrganModel = {
  id: "heart",
  label: "Heart",
  parameters: [
    {
      id: "lvmi",
      label: "LV mass index",
      unit: "g/m^2",
      bounds: [30, 220],
      direction: "higher-worse",
    },
    {
      id: "lv_wall_thickness",
      label: "LV wall thickness",
      unit: "mm",
      bounds: [4, 25],
      direction: "higher-worse",
    },
    {
      id: "ef",
      label: "LV ejection fraction",
      unit: "%",
      bounds: [10, 80],
      direction: "higher-better",
    },
    {
      id: "lavi",
      label: "Left atrial volume index",
      unit: "mL/m^2",
      bounds: [12, 80],
      direction: "higher-worse",
    },
  ],
};
