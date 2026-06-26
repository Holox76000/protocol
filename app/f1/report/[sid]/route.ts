import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "../../../../lib/supabase";
import { getPatterns } from "../../../../lib/report-content";
import { computePreliminaryScore } from "../../../../lib/preliminaryScore";
import { getOrGeneratePersonalization, patternsEyebrowFor } from "../../../../lib/personalization";
import { getTestimonialById } from "../../../../lib/testimonials";

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

  const afterPath = preview?.after_path as string | null;
  const beforePath = preview?.before_path as string | null;
  const hasPhotos = Boolean(beforePath && afterPath && !afterPath.startsWith("__"));

  let projectionBlock = "";
  if (hasPhotos) {
    const [b, a] = await Promise.all([
      supabaseAdmin.storage.from("user-photos").createSignedUrl(beforePath!, TEN_YEARS),
      supabaseAdmin.storage.from("user-photos").createSignedUrl(afterPath!, TEN_YEARS),
    ]);
    const beforeUrl = b.data?.signedUrl ?? "/assets/projection-now.png";
    const afterUrl = a.data?.signedUrl ?? "/assets/projection-potential.png";
    projectionBlock = `
<div style="position:relative;display:flex;">
  <div style="position:relative;width:50%;">
    <img src="${beforeUrl}" alt="You now" style="width:100%;height:clamp(280px, 42vw, 460px);object-fit:cover;object-position:50% 14%;display:block;filter:grayscale(.35) contrast(.97);">
    <span style="position:absolute;left:14px;bottom:14px;font:500 10px/1 'Avenir Next',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.7);">You now</span>
  </div>
  <div style="position:relative;width:50%;">
    <img src="${afterUrl}" alt="Your potential" style="width:100%;height:clamp(280px, 42vw, 460px);object-fit:cover;object-position:50% 14%;display:block;">
    <span style="position:absolute;right:14px;bottom:14px;font:700 10px/1 'Avenir Next',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.7);">Your potential</span>
  </div>
  <span style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(255,255,255,.5);transform:translateX(-50%);"></span>
</div>`;
  } else {
    // No photo: generic placeholder projection with soft CTA inviting upload.
    projectionBlock = `
<div style="position:relative;display:flex;">
  <div style="position:relative;width:50%;">
    <img src="/assets/projection-now.png" alt="You now" style="width:100%;height:clamp(280px, 42vw, 460px);object-fit:cover;object-position:50% 14%;display:block;filter:grayscale(.35) contrast(.97);">
    <span style="position:absolute;left:14px;bottom:14px;font:500 10px/1 'Avenir Next',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.7);">You now</span>
  </div>
  <div style="position:relative;width:50%;">
    <img src="/assets/projection-potential.png" alt="Your potential" style="width:100%;height:clamp(280px, 42vw, 460px);object-fit:cover;object-position:50% 14%;display:block;">
    <span style="position:absolute;right:14px;bottom:14px;font:700 10px/1 'Avenir Next',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.7);">Your potential</span>
  </div>
  <span style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(255,255,255,.5);transform:translateX(-50%);"></span>
</div>
<div style="text-align:center;padding:14px 24px 4px;font:400 11px 'Avenir Next',sans-serif;color:#7f949b;">Generic projection. <a href="/funnel?resume=photo&amp;funnel_sid=${encodeURIComponent(sid)}" style="color:#253239;border-bottom:1px solid #9eb1b8;text-decoration:none;">Add your photo</a> to see yours.</div>`;
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
  const patterns = getPatterns(morphology);
  const score = computePreliminaryScore(answers);

  // Personalization (lazy LLM generation, cached in answers._personalization)
  let personalization = null;
  try {
    personalization = await getOrGeneratePersonalization(sid, answers);
  } catch {
    // Silently fall back to generic. Never break the report on LLM failure.
  }
  const testimonial = getTestimonialById(personalization?.testimonial_id);

  // Build offer URL with all quiz params so the offer page can personalize
  const offerParams = new URLSearchParams({ funnel_sid: sid, funnel: "quiz" });
  const quizKeys = [
    "morphology", "ethnicity", "age_bracket", "past_solutions",
    "weekly_time", "sexual_orientation",
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
    "{{FREQUENCY}}": formatFrequency((answers.weekly_time as string) ?? ""),
    "{{PATTERN_1_TITLE}}": patterns.p1t,
    "{{PATTERN_1_BODY}}": patterns.p1b,
    "{{PATTERN_2_TITLE}}": patterns.p2t,
    "{{PATTERN_2_BODY}}": patterns.p2b,
    "{{PATTERN_3_TITLE}}": patterns.p3t,
    "{{PATTERN_3_BODY}}": patterns.p3b,
    "{{PATTERN_4_TITLE}}": patterns.p4t,
    "{{PATTERN_4_BODY}}": patterns.p4b,
    "{{CHECKOUT_URL}}": offerUrl,
    "{{PREVIEW_URL}}": `/f1/protocol-preview/${sid}`,
    "{{PROJECTION_BLOCK}}": projectionBlock,
    "{{SCORE_NOW}}": String(score.current),
    "{{SCORE_NOW_LABEL}}": score.currentLabel,
    "{{SCORE_POTENTIAL}}": String(score.potential),
    "{{SCORE_POTENTIAL_LABEL}}": score.potentialLabel,
    "{{SCORE_GAIN}}": String(score.potential - score.current),
    "{{FUNNEL_SID}}": sid,
    "{{HERO_SUBTITLE}}": personalization?.hero_subtitle ?? "",
    "{{PATTERNS_EYEBROW}}": patternsEyebrowFor(personalization?.persona_tag),
    "{{PATTERNS_INTRO}}":
      personalization?.patterns_intro ??
      `${morphology} build, ${formatAge((answers.age_bracket as string) ?? "")}, ${formatFrequency((answers.weekly_time as string) ?? "")}. Not your individual analysis, but four patterns that repeat across 2,500+ men with your profile.`,
    "{{TESTIMONIAL_QUOTE}}": testimonial.quote,
    "{{TESTIMONIAL_NAME}}": testimonial.name,
    "{{TESTIMONIAL_META}}": testimonial.meta,
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(key, value);
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
