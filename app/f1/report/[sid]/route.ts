import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "../../../../lib/supabase";

// ── Re-use all helpers from parent route ─────────────────
// (duplicated here to keep the route self-contained)

const TEN_YEARS = 315_360_000;

function formatHeight(answers: Record<string, unknown>): string {
  const unit = answers.height_unit as string | undefined;
  if (unit === "cm") return answers.height_cm ? `${answers.height_cm}cm` : "—";
  const ft = answers.height_ft;
  const inch = answers.height_in;
  if (ft) return inch ? `${ft}'${inch}"` : `${ft}'`;
  return "—";
}

function formatWeight(answers: Record<string, unknown>): string {
  const val = answers.weight_value;
  const unit = answers.weight_unit as string | undefined;
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
  };
  return map[env] ?? (env || "—");
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

interface PatternSet {
  p1t: string; p1b: string;
  p2t: string; p2b: string;
  p3t: string; p3b: string;
  p4t: string; p4b: string;
}

function getPatterns(morphology: string): PatternSet {
  const m = morphology?.toLowerCase();

  if (m === "skinny") return {
    p1t: "Training harder won't change what you see in the mirror",
    p1b: "Men with your build almost always hit the same wall: more effort, same reflection. Without hitting the right structural targets first — shoulder width relative to waist, specifically — added size stays invisible. The issue isn't effort. It's which muscles, in what order.",
    p2t: "Your clothes are working against you",
    p2b: "Skinny frames cause most garments to hang flat. At the same weight, the same person can read as confident or forgettable based on how fabric sits across their shoulders and chest. Clothes don't fix a frame problem — structure does.",
    p3t: "High-volume training was built for someone else",
    p3b: "High-volume programs are designed around average body types. On your frame, they produce fatigue without the visible changes that move your score. What matters isn't total volume — it's which muscles you train, and in what order.",
    p4t: "The target numbers are closer than most people think",
    p4b: "For your build, shoulder-to-waist ratio and upper body density are the two variables that matter most. Both respond fast to focused work. Most men with your profile see visible changes in 4–6 weeks when the plan is right.",
  };

  if (m === "skinny-fat") return {
    p1t: "Your body is gaining fat and losing muscle at the same time",
    p1b: "Skinny-fat is the most misunderstood body type. It typically signals a cortisol-insulin imbalance that causes your body to store fat in the midsection while losing muscle in the limbs. Standard gym programs were designed for other body types and often make this worse.",
    p2t: "Your waist is what's controlling your silhouette",
    p2b: "For your build, waist measurement drives your attractiveness score more than any other variable. A 2–3cm reduction in perceived waist circumference moves your shoulder-to-waist ratio significantly — and that ratio is the strongest single predictor of male physical attractiveness in the data.",
    p3t: "Cutting and bulking both make your body type worse",
    p3b: "Aggressive caloric deficits accelerate muscle loss on skinny-fat frames. Caloric surpluses increase fat storage first. The right path is recomposition — building muscle while losing fat simultaneously, in the right sequence.",
    p4t: "Sleep and stress matter as much as training",
    p4b: "Skinny-fat profiles are almost always cortisol-driven. Sleep quality, stress, and training intensity are as important as the sessions themselves. Fixing one without the others produces partial results at best.",
  };

  if (m === "overweight") return {
    p1t: "Where fat sits matters more than how much you carry",
    p1b: "Your attractiveness score isn't primarily about total body weight — it's about your waist-to-shoulder ratio. Two men at the same weight can score very differently based on fat distribution alone. The plan targets your specific distribution, not just overall fat loss.",
    p2t: "Visceral fat is flattening your V-taper",
    p2b: "Visceral fat (deep abdominal fat) pushes your waist outward, compressing the shoulder-to-waist ratio. It also happens to be the first type to respond to sequenced diet and exercise — it moves faster than subcutaneous fat.",
    p3t: "Standard diets shrink you without improving your shape",
    p3b: "Cut calories, run more — it works for the scale but not for attractiveness. Losing lean mass alongside fat makes you smaller but no more defined. Body composition matters. Scale weight doesn't.",
    p4t: "The structure is already there — it just needs uncovering",
    p4b: "Most men with your build have a strong structural base. It's just covered. The right sequence uncovers it predictably: waist first, then upper body density. That order matters more than total effort.",
  };

  return {
    p1t: "Average is invisible — and most men stay there",
    p1b: "Men who reach average body composition hit a plateau with no obvious reason to push further. 'Acceptable' and 'memorable' are separated by a small physical gap — one most men never close because they're never shown exactly what to aim at.",
    p2t: "Proportions move the score. Weight barely does.",
    p2b: "At average body composition, losing 5kg changes very little about how you're perceived. Shifting your shoulder-to-waist ratio by 0.15 changes a lot. Proportions are the variable. Weight is mostly noise.",
    p3t: "Your environment pays back more than you put in",
    p3b: "In your specific context, looking noticeably above average returns more than the physical effort required to get there. Men who move above their peer group's baseline see social and professional returns well beyond what the physical change alone would suggest.",
    p4t: "The top 20% is a smaller jump than it appears",
    p4b: "Moving from average to the top 20% means hitting specific targets: SWR > 1.52, body fat under 12%, shoulder-to-chest ratio > 1.15. These are measurable and achievable. That's what a real protocol is built around.",
  };
}

function insight(title: string, body: string): string {
  return `<div class="insight"><div class="insight-title">${title}</div><div class="insight-body">${body}</div></div>`;
}

function getAgeInsight(ageBracket: string): string {
  const map: Record<string, [string, string]> = {
    "20–29": [
      "Your 20s: the best window you'll have",
      "The gap between where you are and your peak is typically largest right now. Testosterone is near its highest point — around 25 — and your body adapts to structured training faster than it will at any later stage. Men who act in this window lock in structural changes that hold for 20+ years. The window is wide, but it narrows every year.",
    ],
    "30–39": [
      "Your 30s: the window is still open",
      "Testosterone is still near peak but dropping about 1–2% per year. Metabolism has slowed slightly, which actually makes body composition more predictable when the plan is precise. Men who make structural changes in their 30s tend to hold them longer than men who start earlier but follow generic programs. Motivation, resources, and hormonal environment rarely align this well again.",
    ],
    "40–49": [
      "Your 40s: random training stops working here",
      "High-volume, unfocused training at this stage often increases cortisol without producing visible adaptation. Men on targeted protocols in their 40s see better proportional results than men half their age following generic programs. Precision matters more than effort now.",
    ],
    "50+": [
      "After 50: the approach changes, the potential doesn't",
      "Men who look worse at 55 than at 45 almost always followed the wrong program, not an inevitable biology. What changes after 50 is the work: less about adding mass, more about proportions, posture, and metabolic precision. Men on structured plans at this stage often look better than they did at 40 on generic advice.",
    ],
  };
  const entry = map[ageBracket];
  if (!entry) return "";
  return insight(entry[0], entry[1]);
}

function getEthnicityInsight(ethnicity: string): string {
  const map: Record<string, [string, string]> = {
    "Caucasian": [
      "Your build: wide frame, midsection tendency",
      "European-origin frames often carry natural width in the shoulders, but tend to store fat in the abdominal region first. That fat directly compresses your shoulder-to-waist ratio — the main attractiveness variable. The plan prioritizes waist reduction alongside upper body work to widen that gap.",
    ],
    "Black": [
      "Your build: high natural muscle density",
      "West African-derived profiles tend toward higher natural muscle density. The focus here is refining what's already there — definition and proportion over raw size. Watch out for over-developing non-key muscle groups; it can reduce visual symmetry rather than improve it.",
    ],
    "Asian (East / SE)": [
      "Your build: narrow frame, fast-moving proportions",
      "East and Southeast Asian frames typically feature slimmer bone structure and lower body fat. The main variable is shoulder width relative to your naturally narrow waist. Small gains in shoulder development create a large visible change on this build — faster than most profiles.",
    ],
    "South Asian": [
      "Your build: visceral fat tendency, strong recomposition response",
      "South Asian profiles often show higher visceral fat despite moderate total weight — linked to hormonal and metabolic factors. The waist-to-shoulder ratio is what drives the score here. Targeted abdominal work combined with upper body development produces faster visible results on this build than generic programs.",
    ],
    "Hispanic-Latino": [
      "Your build: responds well to muscle work, lower-abdominal tendency",
      "Hispanic-Latino frames tend to carry muscle well and adapt quickly to hypertrophy training. The main challenge is typically fat distribution in the lower abdominal region. Sequenced fat reduction followed by targeted structural building works well here — results come faster than most profiles.",
    ],
    "MENA": [
      "Your build: high development potential, recomposition-focused",
      "Middle Eastern and North African profiles often combine strong muscle development potential with elevated abdominal fat storage. The approach here is recomposition: build muscle density while reducing fat in the areas that most affect the waist-to-shoulder ratio. Your build responds well to this kind of structured work.",
    ],
  };
  const entry = map[ethnicity];
  if (!entry) return "";
  return insight(entry[0], entry[1]);
}

function getEnvParagraph(env: string): string {
  const map: Record<string, string> = {
    "Corporate": "In corporate settings, body composition affects perceived authority — separate from actual performance. Research on executive presence shows the effect is real and consistent. The visual markers that matter here are posture, shoulder width relative to frame, and the signal of a lean, defined physique. Those are the targets.",
    "Entrepreneur / Startup": "In startup and entrepreneurial environments, physical presence reads as a social signal in meetings, pitches, and rooms where you're being assessed quickly. The look associated with high-performers here — lean, composed, slightly above average — is closer than most men expect. We focus on what moves fastest for your profile.",
    "Manual / Trade work": "Your work already signals physical strength. The targets here are the visual markers that register outside of that context — proportionality, a defined waist, upper body shape that reads well socially and personally, not just professionally.",
    "Student": "Peer comparison in student environments is constant, and physical attractiveness affects social dynamics and confidence more directly at this stage than at most others. The plan produces visible results in 12 weeks — one academic term — with a schedule that fits around full-time study.",
    "Creative / Freelance": "No dress code means physical presence stands out more, not less. In creative environments, the men who read as high-performers tend to look composed and healthy, not muscular. That's a different target than most programs are built for.",
    "Medical / Healthcare": "You already understand the physiology. The studies behind this plan are the same literature you're familiar with — applied to attractiveness specifically, not clinical health. The goal is different, and so is the approach.",
  };
  return map[env] ?? "Your environment shapes which changes produce the most visible return. The plan focuses on the proportional improvements — shoulder-to-waist ratio, body fat, and structural definition — that register well in most social contexts.";
}

function getHistoryParagraph(pastSolutions: string | string[] | unknown): string {
  const raw = Array.isArray(pastSolutions) ? pastSolutions.join("|") : String(pastSolutions ?? "");
  const solutions = raw.toLowerCase();
  if (solutions.includes("nothing")) return "Starting from zero is an advantage. Men who've tried things before often have patterns to undo. You don't. The fitness industry is built for size and weight loss — not attractiveness. Building the right approach from the start is faster than unbuilding the wrong one.";
  if (solutions.includes("personal trainer")) return "Personal trainers build programs for fitness, performance, or body composition — not attractiveness. The goal is different, and so is the work. Attractiveness optimization isn't covered in trainer certifications. What you've done isn't wasted — it just wasn't aimed at the right target.";
  if (solutions.includes("youtube")) return "YouTube is optimized for views, not results for your specific build. The people with millions of views are genetic outliers making their personal experience look like universal advice. Your actual variables are specific enough that no general video covers them.";
  if (solutions.includes("diet")) return "Diets produce weight changes — not necessarily attractiveness changes. Losing weight without structure often removes muscle alongside fat, which can make you smaller without making you look better. What you lose matters as much as how much you lose.";
  if (solutions.includes("surgery")) return "Medical interventions target single variables. They can work for specific changes, but attractiveness is driven by the interaction between body composition, proportions, and lifestyle — not any one factor in isolation.";
  return "What you've tried wasn't built for this goal. Fitness programs, nutrition plans, and generic advice are designed for health or weight management. None of them target what actually drives attractiveness.";
}

// ── Route handler ─────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sid: string }> }
) {
  const { sid } = await params;

  // 1. Fetch quiz answers from funnel_sessions
  const { data: sessionData } = await supabaseAdmin
    .from("funnel_sessions")
    .select("answers")
    .eq("session_id", sid)
    .single();

  const answers = (sessionData?.answers ?? {}) as Record<string, unknown>;

  // 2. Fetch before/after image paths
  const { data: preview } = await supabaseAdmin
    .from("visualization_previews")
    .select("before_path, after_path")
    .eq("preview_id", sid)
    .single();

  let beforePhoto = "[ Your current photo ]";
  let afterPhoto = "[ Your projected potential ]";

  const afterPath = preview?.after_path as string | null;
  const beforePath = preview?.before_path as string | null;

  if (beforePath && afterPath && !afterPath.startsWith("__")) {
    const [b, a] = await Promise.all([
      supabaseAdmin.storage.from("user-photos").createSignedUrl(beforePath, TEN_YEARS),
      supabaseAdmin.storage.from("user-photos").createSignedUrl(afterPath, TEN_YEARS),
    ]);
    if (b.data?.signedUrl) beforePhoto = `<img src="${b.data.signedUrl}" alt="You now" />`;
    if (a.data?.signedUrl) afterPhoto = `<img src="${a.data.signedUrl}" alt="Your potential" />`;
  }

  // 2b. Log report_viewed — awaited before returning HTML (Netlify kills the function on response)
  await supabaseAdmin.from("event_sessions").upsert(
    { session_id: sid, event: "report_viewed", step: null, payload: { funnel_sid: sid }, created_at: new Date().toISOString() },
    { onConflict: "session_id,event,step" }
  );

  // 3. Load & fill template
  const templatePath = path.join(process.cwd(), "data", "report-template.html");
  let html = fs.readFileSync(templatePath, "utf-8");

  const morphology = (answers.morphology as string) ?? "Average";
  const env = (answers.social_environment as string) ?? "";
  const patterns = getPatterns(morphology);

  // Build offer URL with all quiz params so the offer page can personalize
  const offerParams = new URLSearchParams({ funnel_sid: sid, funnel: "quiz" });
  const quizKeys = [
    "morphology", "ethnicity", "age_bracket", "past_solutions",
    "expected_results", "social_environment", "weekly_time",
    "height_unit", "height_ft", "height_in", "height_cm",
    "weight_value", "weight_unit", "weight_kg", "first_name",
  ];
  for (const key of quizKeys) {
    const val = answers[key];
    if (val == null) continue;
    offerParams.set(key, Array.isArray(val) ? val.join("|") : String(val));
  }
  const offerUrl = `/f1/offer?${offerParams.toString()}`;

  const replacements: Record<string, string> = {
    "{{FIRST_NAME}}": (answers.first_name as string) ?? "You",
    "{{DATE}}": formatDate(),
    "{{AGE}}": formatAge((answers.age_bracket as string) ?? ""),
    "{{HEIGHT}}": formatHeight(answers),
    "{{WEIGHT}}": formatWeight(answers),
    "{{BODY_TYPE}}": morphology,
    "{{ENV}}": formatEnv(env),
    "{{FREQUENCY}}": formatFrequency((answers.weekly_time as string) ?? ""),
    "{{PATTERN_1_TITLE}}": patterns.p1t,
    "{{PATTERN_1_BODY}}": patterns.p1b,
    "{{PATTERN_2_TITLE}}": patterns.p2t,
    "{{PATTERN_2_BODY}}": patterns.p2b,
    "{{PATTERN_3_TITLE}}": patterns.p3t,
    "{{PATTERN_3_BODY}}": patterns.p3b,
    "{{PATTERN_4_TITLE}}": patterns.p4t,
    "{{PATTERN_4_BODY}}": patterns.p4b,
    "{{ENVIRONMENT_PARAGRAPH}}": getEnvParagraph(env),
    "{{HISTORY_PARAGRAPH}}": getHistoryParagraph((answers.past_solutions as string) ?? ""),
    "{{CHECKOUT_URL}}": offerUrl,
    "{{BEFORE_PHOTO}}": beforePhoto,
    "{{AFTER_PHOTO}}": afterPhoto,
    "{{AGE_INSIGHT}}": getAgeInsight((answers.age_bracket as string) ?? ""),
    "{{ETHNICITY_INSIGHT}}": getEthnicityInsight((answers.ethnicity as string) ?? ""),
    "{{FUNNEL_SID}}": sid,
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(key, value);
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
