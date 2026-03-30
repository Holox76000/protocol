import type { FunnelVariant } from "./funnels";

export const VISUALIZATION_STEPS = ["upload", "preview", "unlock"] as const;
export const MAIN_VISUALIZATION_SCREENS = ["upload-intro", ...VISUALIZATION_STEPS, "unlock-info"] as const;

export type VisualizationStep = (typeof VISUALIZATION_STEPS)[number];
export type MainVisualizationScreen = (typeof MAIN_VISUALIZATION_SCREENS)[number];
export type VisualizationScreenMode = "default" | "uploadIntro" | "unlockInfo";

export function isVisualizationStep(value: string): value is VisualizationStep {
  return VISUALIZATION_STEPS.includes(value as VisualizationStep);
}

export function isMainVisualizationScreen(value: string): value is MainVisualizationScreen {
  return MAIN_VISUALIZATION_SCREENS.includes(value as MainVisualizationScreen);
}

export function getVisualizationStepNumber(step: VisualizationStep) {
  return VISUALIZATION_STEPS.indexOf(step) + 1;
}

export function getMainVisualizationScreenHref(screen: MainVisualizationScreen) {
  return `/visualization/${screen}`;
}

export function getMainVisualizationScreenConfig(screen: MainVisualizationScreen): {
  step: VisualizationStep;
  mode: VisualizationScreenMode;
} {
  if (screen === "upload-intro") {
    return { step: "upload", mode: "uploadIntro" };
  }

  if (screen === "unlock-info") {
    return { step: "unlock", mode: "unlockInfo" };
  }

  return { step: screen, mode: "default" };
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
