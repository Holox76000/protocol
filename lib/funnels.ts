import { getMainVisualizationScreenHref, getVisualizationStepHref } from "./visualizationFlow";

export type FunnelVariant = "main" | "f2" | "v3";

type FunnelConfig = {
  funnel: FunnelVariant;
  landingHref: string;
  visualizationHref: string;
  checkoutHref: string;
  landingPrimaryHref: string;
  landingPrimaryLabel: string;
  landingSecondaryLabel: string;
  pricingCtaLabel: string;
  transformationCtaLabel: string;
  footerCtaLabel: string;
  visualizationNextHref: string;
  visualizationNextLabel: string;
  visualizationNextTitle: string;
  visualizationNextDescription: string;
};

function withQuery(path: string, funnel: FunnelVariant) {
  const separator = path.includes("?") ? "&" : "?";
  const publicFunnel = funnel === "f2" ? "v2" : funnel;
  return `${path}${separator}funnel=${publicFunnel}`;
}

export function getFunnelConfig(funnel: FunnelVariant = "main"): FunnelConfig {
  if (funnel === "f2") {
    const checkoutHref = withQuery("/checkout", funnel);

    return {
      funnel,
      landingHref: "/f2/landing",
      visualizationHref: getVisualizationStepHref(funnel, "upload"),
      checkoutHref,
      landingPrimaryHref: checkoutHref,
      landingPrimaryLabel: "Join Now",
      landingSecondaryLabel: "Start Now",
      pricingCtaLabel: "Get Access",
      transformationCtaLabel: "Start Your Glow-Up",
      footerCtaLabel: "Get Your $19 Body Analysis Today",
      visualizationNextHref: "/f2/landing",
      visualizationNextLabel: "Reach my potential",
      visualizationNextTitle: "Next step: unlock your full plan",
      visualizationNextDescription: "See the exact method, science, and protocol built to turn this preview into a real outcome.",
    };
  }

  if (funnel === "v3") {
    const checkoutHref = withQuery("/checkout", funnel);

    return {
      funnel,
      landingHref: "/v3",
      visualizationHref: getVisualizationStepHref(funnel, "upload"),
      checkoutHref,
      landingPrimaryHref: getVisualizationStepHref(funnel, "upload"),
      landingPrimaryLabel: "Start Visualization",
      landingSecondaryLabel: "See Your Potential",
      pricingCtaLabel: "Continue to Questions",
      transformationCtaLabel: "Continue to Questions",
      footerCtaLabel: "Continue to Questions",
      visualizationNextHref: "/v3/questions",
      visualizationNextLabel: "Continue to questionnaire",
      visualizationNextTitle: "Next step: answer a few questions",
      visualizationNextDescription: "Complete a short questionnaire so we can frame your transformation plan before checkout.",
    };
  }

  return {
    funnel: "main",
    landingHref: "/",
    visualizationHref: getMainVisualizationScreenHref("upload-intro"),
    checkoutHref: withQuery("/checkout", "main"),
    landingPrimaryHref: withQuery("/checkout", "main"),
    landingPrimaryLabel: "Get My Plan — $19",
    landingSecondaryLabel: "See My Transformation — $19",
    pricingCtaLabel: "Get My Plan — $19",
    transformationCtaLabel: "Start Now — $19",
    footerCtaLabel: "Get My Plan — $19",
    visualizationNextHref: withQuery("/checkout", "main"),
    visualizationNextLabel: "Reach my potential",
    visualizationNextTitle: "Next step: reach your potential",
    visualizationNextDescription: "Your preview is ready. Unlock the full body analysis and transformation protocol behind it.",
  };
}
