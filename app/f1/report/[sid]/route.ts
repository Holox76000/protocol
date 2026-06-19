import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "../../../../lib/supabase";
import {
  getPatterns,
  getAgeInsight,
  getEthnicityInsight,
  getEnvParagraph,
  getHistoryParagraph,
} from "../../../../lib/report-content";

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
    "sexual_orientation",
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
