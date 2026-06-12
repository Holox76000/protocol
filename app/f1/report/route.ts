import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

// ── Helpers ──────────────────────────────────────────────

function formatHeight(params: URLSearchParams): string {
  const unit = params.get("height_unit");
  if (unit === "cm") {
    const cm = params.get("height_cm");
    return cm ? `${cm}cm` : "—";
  }
  const ft = params.get("height_ft");
  const inch = params.get("height_in");
  if (ft) return inch ? `${ft}'${inch}"` : `${ft}'`;
  return "—";
}

function formatWeight(params: URLSearchParams): string {
  const val = params.get("weight_value");
  const unit = params.get("weight_unit");
  if (!val) return "—";
  return unit ? `${val}${unit}` : `${val}kg`;
}

function formatAge(ageBracket: string): string {
  const map: Record<string, string> = {
    "20–29": "20s", "30–39": "30s", "40–49": "40s", "50+": "50s+",
  };
  return map[ageBracket] ?? ageBracket;
}

function formatEnv(env: string): string {
  const map: Record<string, string> = {
    "Corporate": "Corporate",
    "Entrepreneur / Startup": "Startup",
    "Manual / Trade work": "Trade",
    "Student": "Student",
    "Creative / Freelance": "Creative",
    "Medical / Healthcare": "Medical",
    "Other": "Other",
  };
  return map[env] ?? env;
}

function formatFrequency(weekly: string): string {
  const map: Record<string, string> = {
    "Zero effort right now": "0h/wk",
    "Less than 1 hour": "<1h/wk",
    "1 to 3 hours": "1–3h/wk",
    "3 to 5 hours": "3–5h/wk",
    "More than 5 hours": "5h+/wk",
  };
  return map[weekly] ?? weekly;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ── Pattern content by morphology ────────────────────────

interface PatternSet {
  p1t: string; p1b: string;
  p2t: string; p2b: string;
  p3t: string; p3b: string;
  p4t: string; p4b: string;
}

function getPatterns(morphology: string): PatternSet {
  const m = morphology?.toLowerCase();

  if (m === "skinny") return {
    p1t: "The frame trap — when muscle is invisible",
    p1b: "Men with your body type almost always hit the same wall: training harder produces marginal visual changes. This isn't a motivation problem — it's a sequencing problem. Without hitting key structural targets first (shoulder width relative to waist, for example), overall size remains imperceptible.",
    p2t: "Your clothes are hiding your potential",
    p2b: "Skinny frames cause most garments to hang flat. This isn't aesthetic — it directly affects first impressions. The same person at the same weight can register as confident or unmemorable simply based on how fabric behaves across their shoulders and chest.",
    p3t: "Volume-focused training has failed your profile before",
    p3b: "High-volume lifting programs are built for average body types. For your frame, they produce fatigue without the visual changes that actually move your attractiveness score. The lever isn't total volume — it's the specific muscles trained, in a specific sequence.",
    p4t: "Your target metrics are achievable in 12 weeks",
    p4b: "Based on your profile, shoulder-to-waist ratio (SWR) and upper body density are your two primary levers. Both respond fast to targeted stimulus. Most men with your profile see measurable visual changes in 4–6 weeks when the protocol is correct.",
  };

  if (m === "skinny-fat") return {
    p1t: "The simultaneous muscle-loss and fat-gain loop",
    p1b: "Skinny-fat is the most misunderstood body type. It typically signals a cortisol-insulin imbalance causing your body to store fat preferentially in the midsection while losing muscle in the limbs. Standard gym programs are designed for other body types and often accelerate this pattern.",
    p2t: "Your waist is dominating your silhouette",
    p2b: "For your profile, the waist measurement controls your attractiveness score more than any other variable. A 2–3cm reduction in perceived waist circumference creates a disproportionate jump in the shoulder-to-waist ratio — the single strongest predictor of male physical attractiveness in peer-reviewed research.",
    p3t: "Cutting and bulking makes your body type worse",
    p3b: "Aggressive caloric deficits accelerate muscle loss on skinny-fat frames. Caloric surpluses increase fat storage first. The optimal path is a recomposition protocol — simultaneously preserving and building muscle while targeting fat tissue in the right sequence.",
    p4t: "Hormone context determines your progress rate",
    p4b: "Skinny-fat profiles are almost always cortisol-driven. Sleep quality, stress management, and training intensity are as important as the training itself. Your protocol addresses all three because without it, physical work alone won't produce the results your profile is capable of.",
  };

  if (m === "overweight") return {
    p1t: "Where fat sits matters more than how much",
    p1b: "Your attractiveness score is not primarily determined by total body weight — it's driven by your waist-to-shoulder ratio. Men at the same weight can have vastly different attractiveness scores based on fat distribution alone. The protocol targets your specific distribution, not just overall fat loss.",
    p2t: "Visceral fat is compressing your V-taper",
    p2b: "Visceral fat (deep abdominal fat) pushes your waist outward, collapsing the shoulder-to-waist ratio that signals physical dominance. This fat type is also the first to respond to properly sequenced diet and exercise — it responds faster than subcutaneous fat.",
    p3t: "Most diet approaches destroy your lean mass simultaneously",
    p3b: "The standard approach — cut calories, run more — is effective for scale weight but poor for attractiveness. Losing lean mass alongside fat reduces muscle density, making you smaller but not more defined. Your protocol prioritizes body composition, not just weight.",
    p4t: "The right sequence reveals your existing structure",
    p4b: "Most men with your profile have a strong structural base already built — it's just covered. The correct protocol uncovers it in a predictable sequence: waist first, then upper body density. This produces visible changes faster than standard weight-loss protocols.",
  };

  // Average (default)
  return {
    p1t: "The 'acceptable' plateau — why average men stop improving",
    p1b: "Men who reach average body composition typically hit a motivation plateau. There's no urgent problem, so there's no urgency to change. But 'acceptable' and 'memorable' are separated by a small physiological gap — one most men never cross because they're never shown a precise target.",
    p2t: "Your proportions, not your weight, are the issue",
    p2b: "At average body composition, the attractiveness gains from losing 5kg are minimal. The gains from shifting your shoulder-to-waist ratio by 0.15 are significant. This distinction — proportions over weight — is what separates effective protocols from generic fitness advice.",
    p3t: "Your social context amplifies results disproportionately",
    p3b: "In your specific environment, looking noticeably above-average creates outsized social returns. Men who improve their physical attractiveness above their peer group gain disproportionate influence in professional and social contexts. This isn't vanity — it's leverage.",
    p4t: "The top 20% is closer than you think",
    p4b: "Moving from average to the top 20% requires hitting specific measurable targets: SWR > 1.52, body fat under 12%, shoulder-to-chest ratio > 1.15. These are precise, achievable, and measurable. That's what your protocol is built around.",
  };
}

// ── Environment paragraph ─────────────────────────────────

function getEnvParagraph(env: string): string {
  const map: Record<string, string> = {
    "Corporate": "In a corporate environment, physical appearance directly influences how you're perceived in leadership contexts. Studies on executive presence consistently show that body composition affects perceived authority and competence — independent of actual performance. Your protocol is calibrated to improve the specific visual markers that register in professional settings: posture, shoulder width relative to frame, and the discipline signal of a lean, defined physique.",
    "Entrepreneur / Startup": "In entrepreneur and startup environments, physical presence functions as a social signal in meetings, pitches, and networking. The specific aesthetic associated with high-performers in this context — lean, composed, slightly above average — is achievable in a shorter window than most men expect. Your protocol focuses on the fastest-moving levers for your profile.",
    "Manual / Trade work": "In manual and trade contexts, physical strength signals are already established through your work. Your protocol focuses on the visual markers that register outside work — the proportionality, the defined waist, the upper body shape that makes a difference in social settings beyond your professional context.",
    "Student": "In student environments, peer comparison happens constantly and physical attractiveness affects social dynamics and confidence more directly than at almost any other life stage. Your protocol is designed to produce results in 12 weeks — one academic term — with a schedule compatible with full-time study.",
    "Creative / Freelance": "In creative and freelance contexts, there's no dress code enforcing uniform appearance — which means physical presence stands out more, not less. The men who register as high-performers in these environments tend to look composed and healthy, not bulky. Your protocol targets those specific visual markers.",
    "Medical / Healthcare": "Working in medical or healthcare means you understand the physiology. Your protocol is built on the same peer-reviewed research you're already familiar with, applied specifically to attractiveness optimization rather than clinical health outcomes. The targets are different, and the methodology reflects that.",
  };
  return map[env] ?? "Your social environment shapes which physical changes produce the most visible social return. Based on your profile, your protocol focuses on the proportional improvements — shoulder-to-waist ratio, body fat percentage, and structural definition — that register positively across contexts.";
}

// ── History paragraph ─────────────────────────────────────

function getHistoryParagraph(pastSolutions: string): string {
  const solutions = pastSolutions?.toLowerCase() ?? "";

  if (solutions.includes("nothing")) {
    return "You haven't tried anything yet — which is actually an advantage. Most men who come to us have tried approaches built for the wrong goal. The fitness industry is optimized for size and weight loss, not attractiveness. Starting from zero means you can build the right habits from day one, without needing to unlearn ineffective patterns.";
  }
  if (solutions.includes("personal trainer")) {
    return "Personal trainers build programs for general fitness, performance, or body composition — not for attractiveness specifically. The goals are different, which means the methodology is different. Shoulder-to-waist ratio optimization, lifestyle calibration, and facial-to-body harmony aren't part of standard trainer education. The work you've done isn't wasted — but it wasn't aimed at the right target.";
  }
  if (solutions.includes("youtube")) {
    return "YouTube fitness advice is optimized for broad appeal and view counts — not for your specific profile. The men getting millions of views are typically outliers with exceptional genetics presenting general advice as universal. For your body type and your goals, the relevant variables are more specific than any general content can address.";
  }
  if (solutions.includes("diet")) {
    return "Strict diets produce weight changes, not necessarily attractiveness changes. Losing weight on an unstructured plan often reduces muscle alongside fat — which can lower attractiveness scores even while reducing total body weight. The composition of what you lose matters as much as how much you lose.";
  }
  if (solutions.includes("surgery")) {
    return "Medical interventions address single variables in isolation. They can be effective for specific changes, but attractiveness is systemic — determined by the interaction between body composition, proportionality, and lifestyle markers. No single intervention addresses the full system. Your protocol does.";
  }
  return "You've been doing what most men do — trying approaches that were never designed for your goal. Fitness, nutrition, and generic programs are built for general health or weight management. None of them are aimed at optimizing the specific variables that drive attractiveness. That's what makes Protocol different.";
}

// ── Route handler ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Load template
  const templatePath = path.join(process.cwd(), "data", "report-template.html");
  let html = fs.readFileSync(templatePath, "utf-8");

  // Build offer URL (pass through all current params)
  const vslUrl = `/f1/offer?${params.toString()}`;

  // Compute values
  const firstName = params.get("first_name") ?? "You";
  const morphology = params.get("morphology") ?? "Average";
  const env = params.get("social_environment") ?? "";
  const weekly = params.get("weekly_time") ?? "";
  const ageBracket = params.get("age_bracket") ?? "";
  const patterns = getPatterns(morphology);

  // Before/after images (passed from loading page once generation is done)
  const beforeUrl = params.get("before_url");
  const afterUrl = params.get("after_url");
  const beforePhoto = beforeUrl
    ? `<img src="${beforeUrl}" alt="You now" />`
    : `[ Your current photo ]`;
  const afterPhoto = afterUrl
    ? `<img src="${afterUrl}" alt="Your potential" />`
    : `[ Your projected potential ]`;

  // Apply replacements
  const replacements: Record<string, string> = {
    "{{FIRST_NAME}}": firstName,
    "{{DATE}}": formatDate(),
    "{{AGE}}": formatAge(ageBracket),
    "{{HEIGHT}}": formatHeight(params),
    "{{WEIGHT}}": formatWeight(params),
    "{{BODY_TYPE}}": morphology,
    "{{ENV}}": formatEnv(env),
    "{{FREQUENCY}}": formatFrequency(weekly),
    "{{PATTERN_1_TITLE}}": patterns.p1t,
    "{{PATTERN_1_BODY}}": patterns.p1b,
    "{{PATTERN_2_TITLE}}": patterns.p2t,
    "{{PATTERN_2_BODY}}": patterns.p2b,
    "{{PATTERN_3_TITLE}}": patterns.p3t,
    "{{PATTERN_3_BODY}}": patterns.p3b,
    "{{PATTERN_4_TITLE}}": patterns.p4t,
    "{{PATTERN_4_BODY}}": patterns.p4b,
    "{{ENVIRONMENT_PARAGRAPH}}": getEnvParagraph(env),
    "{{HISTORY_PARAGRAPH}}": getHistoryParagraph(params.get("past_solutions") ?? ""),
    "{{CHECKOUT_URL}}": vslUrl,
    "{{BEFORE_PHOTO}}": beforePhoto,
    "{{AFTER_PHOTO}}": afterPhoto,
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(key, value);
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
