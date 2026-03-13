import type { FunnelVariant } from "./funnels";

export const VISUALIZATION_STEPS = ["upload", "preview", "unlock"] as const;

export type VisualizationStep = (typeof VISUALIZATION_STEPS)[number];

export function isVisualizationStep(value: string): value is VisualizationStep {
  return VISUALIZATION_STEPS.includes(value as VisualizationStep);
}

export function getVisualizationStepNumber(step: VisualizationStep) {
  return VISUALIZATION_STEPS.indexOf(step) + 1;
}

export function getVisualizationStepHref(funnel: FunnelVariant, step: VisualizationStep) {
  if (funnel === "f2") {
    return `/f2/visualization/${step}`;
  }

  if (funnel === "v3") {
    return `/v3/visualization/${step}`;
  }

  return `/visualization/${step}`;
}
