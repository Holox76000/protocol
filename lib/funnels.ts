import { getMainVisualizationScreenHref, getVisualizationStepHref } from "./visualizationFlow";

export type FunnelVariant = "main" | "f2" | "v3" | "woman" | "f1";

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
  if (funnel === "f1") {
    const checkoutHref = withQuery("/checkout/hosted", funnel);

    return {
      funnel,
      landingHref: "/f1",
      visualizationHref: "/f1/offer",
      checkoutHref,
      landingPrimaryHref: "/f1/offer",
      landingPrimaryLabel: "Start your Protocol — $49",
      landingSecondaryLabel: "Start your Protocol",
      pricingCtaLabel: "Start your Protocol — $49",
      transformationCtaLabel: "Start your Protocol — $49",
      footerCtaLabel: "Start your Protocol — $49",
      visualizationNextHref: checkoutHref,
      visualizationNextLabel: "Start your Protocol",
      visualizationNextTitle: "Start your Protocol",
      visualizationNextDescription: "Your personalized attractiveness protocol is one step away.",
    };
  }

  if (funnel === "f2") {
    const checkoutHref = withQuery("/checkout/hosted", funnel);

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
    const checkoutHref = withQuery("/checkout/hosted", funnel);

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

  if (funnel === "woman") {
    const checkoutHref = withQuery("/checkout/hosted", funnel);

    return {
      funnel,
      landingHref: "/woman",
      visualizationHref: withQuery("/woman/offer", funnel),
      checkoutHref,
      landingPrimaryHref: withQuery("/woman/offer", funnel),
      landingPrimaryLabel: "Get My Protocol",
      landingSecondaryLabel: "Get My Protocol",
      pricingCtaLabel: "Get My Protocol",
      transformationCtaLabel: "Get My Protocol",
      footerCtaLabel: "Get My Protocol",
      visualizationNextHref: checkoutHref,
      visualizationNextLabel: "Continue to checkout",
      visualizationNextTitle: "Next step: claim your transformation plan",
      visualizationNextDescription: "Your personalized women’s body analysis and transformation protocol are ready to unlock.",
    };
  }

  return {
    funnel: "main",
    landingHref: "/",
    visualizationHref: getMainVisualizationScreenHref("upload-intro"),
    checkoutHref: withQuery("/checkout/hosted", "main"),
    landingPrimaryHref: withQuery("/offer", "main"),
    landingPrimaryLabel: "Get My Plan — $19",
    landingSecondaryLabel: "Get My Plan — $19",
    pricingCtaLabel: "Get My Plan — $19",
    transformationCtaLabel: "Start Now — $19",
    footerCtaLabel: "Get My Plan — $19",
    visualizationNextHref: withQuery("/checkout/hosted", "main"),
    visualizationNextLabel: "Reach my potential",
    visualizationNextTitle: "Next step: reach your potential",
    visualizationNextDescription: "Your preview is ready. Unlock the full body analysis and transformation protocol behind it.",
  };
}
