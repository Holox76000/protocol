/**
 * Builds a Social & Environmental Context block for AI generation prompts.
 * Translates raw questionnaire values into actionable physique guidance
 * so every generated report accounts for the client's social environment.
 */

interface SocialContextInput {
  professional_environment?: string | null;
  professional_environment_other?: string | null;
  typical_clothing?: string | null;
  social_perception?: string[] | null;
  first_name?: string | null;
}

// ── Professional environment → physique ceiling & priority ──────────────────

const ENV_GUIDANCE: Record<string, { constraint: string; priority: string }> = {
  corporate: {
    constraint:
      "Lean athletic is the ceiling — think 'suit-ready'. A bulky, over-muscled build " +
      "signals gym-bro, not executive. Thick traps, a neck over 43 cm, or arms that strain " +
      "shirt sleeves actively undermine professional credibility in corporate settings. " +
      "The target physique is the one that looks powerful in a tailored suit.",
    priority:
      "Shoulder-to-waist V-taper, low visible body fat (10–13%), posture, and a defined but " +
      "not oversized upper body. Face leanness matters — a leaner face reads as sharper and " +
      "more authoritative in boardroom contexts.",
  },
  creative: {
    constraint:
      "Lean aesthetic physique — style-forward. Visible definition is valued over raw mass. " +
      "Overly bulky arms or thick traps limit clothing options and clash with the creative " +
      "environment's aesthetic norms. The body should look intentional, not just big.",
    priority:
      "Definition, leanness, and proportional development. A clean waist, defined arms at " +
      "moderate size, and an aesthetic silhouette. Body fat below 12% has high ROI here.",
  },
  public_facing: {
    constraint:
      "Approachable athletic — visible health and confidence without crossing into intimidating. " +
      "The physique should project trust, competence, and energy — not dominance or aggression.",
    priority:
      "Low body fat, good posture, and a proportional build that reads as healthy and confident. " +
      "Avoid anything that makes clients feel physically overwhelmed.",
  },
  physical_trades: {
    constraint:
      "No ceiling on mass or strength — a broad, powerful build is socially normal and " +
      "respected in physical trades environments. Functional mass is an asset, not a liability.",
    priority:
      "Strength, functional muscle mass, and joint health. A heavier, more muscular build " +
      "is appropriate and expected. Prioritize resilience and performance over aesthetics.",
  },
  entrepreneur: {
    constraint:
      "Flexible — context shifts from boardroom pitches to casual team environments. " +
      "A moderately athletic build (10–13% BF, clear V-taper, no extremes) works across " +
      "all contexts without sacrificing credibility in any of them.",
    priority:
      "Balanced development, high energy, and a physique that reads as disciplined and healthy. " +
      "Avoid extremes in either direction — both 'too bulky' and 'too lean' can undermine " +
      "the versatile presence an entrepreneur needs.",
  },
  student: {
    constraint:
      "No strong professional constraint at this stage. Focus on building a confident, " +
      "healthy foundation that will serve as a long-term asset.",
    priority:
      "Confidence, posture, and establishing sustainable habits. " +
      "Any meaningful aesthetic improvement has outsized social impact at this life stage.",
  },
  other: {
    constraint:
      "No specific professional constraint identified. Optimize for the client's stated goal.",
    priority: "Goal-aligned development.",
  },
};

// ── Clothing → practical physique constraint ─────────────────────────────────

const CLOTHING_NOTE: Record<string, string> = {
  formal:
    "Client wears suits and dress shirts. Avoid building a neck over 43 cm or shoulders " +
    "that make off-the-rack jackets unwearable. Target an 'athletic fit suit' physique — " +
    "broad shoulders, narrow waist, arms that fill a sleeve without splitting it.",
  smart_casual:
    "Smart casual clothing — a lean athletic build photographs and dresses well in this " +
    "style. Moderate size upper body, clean waist.",
  casual:
    "No clothing constraint — any well-proportioned physique works in casual wear.",
  athletic:
    "Athletic clothing — physique is frequently visible. Definition and muscle separation " +
    "have high ROI here.",
  workwear:
    "Functional workwear — size and strength are practical assets. No clothing constraint.",
};

// ── Social perception → transformation objective ─────────────────────────────

const PERCEPTION_OBJECTIVE: Record<string, string> = {
  forgettable:
    "Currently perceived as forgettable or invisible. Physical transformation has the " +
    "highest possible ROI here — improving posture, V-taper, and leanness alone will " +
    "dramatically shift social impact. Priority: build physical presence.",
  intimidating:
    "Already perceived as intimidating. Adding further mass without counterbalancing with " +
    "grooming, posture, and approachable style improvements could be counterproductive. " +
    "Priority: refine rather than add. Aesthetic quality over raw size.",
  approachable:
    "Good social baseline — perceived as friendly and approachable. Goal is to add " +
    "physical authority and attractiveness without losing that warmth.",
  trustworthy:
    "Perceived as trustworthy and reliable — strong social foundation. " +
    "Physical improvements will reinforce and amplify this existing perception.",
  attractive:
    "Already perceived as physically attractive — transformation is refinement, not reinvention. " +
    "Small improvements in body composition and posture will have compounding returns.",
  professional:
    "Perceived as professional and put-together — maintain that polish throughout the protocol. " +
    "Avoid changes that disrupt this impression.",
  average_looking:
    "Perceived as average — significant upside potential. A clear physique improvement " +
    "will move the needle noticeably from this baseline.",
  awkward:
    "Perceived as awkward or unsure. Posture work and body language improvements will have " +
    "outsized ROI — physique changes alone will not be enough. Confidence is the missing variable.",
  young_for_age:
    "Perceived as young for age — this is an asset. Protocol should build toward a physique " +
    "that reads as mature, capable, and physically developed without sacrificing that youth.",
  unsure:
    "Uncertain of current social perception — protocol should build a strong enough baseline " +
    "that the client develops clear self-awareness as a side effect of physical improvement.",
};

// ── Main export ───────────────────────────────────────────────────────────────

export function socialContextBlock(d: SocialContextInput): string {
  const env = d.professional_environment ?? "other";
  const envOther = d.professional_environment_other;
  const clothing = d.typical_clothing ?? "";
  const perceptions = d.social_perception ?? [];

  const guidance = ENV_GUIDANCE[env] ?? ENV_GUIDANCE.other;
  const clothingNote = CLOTHING_NOTE[clothing] ?? null;

  const perceptionLines = perceptions
    .filter((p) => PERCEPTION_OBJECTIVE[p])
    .map((p) => `- ${PERCEPTION_OBJECTIVE[p]}`)
    .join("\n");

  const envLabel = envOther
    ? `Other — ${envOther}`
    : env.replace(/_/g, " ");

  return `### Social & Environmental Context
IMPORTANT: Every recommendation in this report must be filtered through these social constraints.
A physique that is physiologically optimal but socially misaligned is a failed protocol.

**Professional environment:** ${envLabel}
**Physique constraint:** ${guidance.constraint}
**Priority:** ${guidance.priority}
${clothingNote ? `\n**Clothing constraint:** ${clothingNote}` : ""}
${perceptionLines ? `\n**Social perception → objective:**\n${perceptionLines}` : ""}`;
}
