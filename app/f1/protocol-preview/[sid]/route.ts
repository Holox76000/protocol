import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "../../../../lib/supabase";

/**
 * Mid-funnel intermediate page between /f1/report/[sid] and /f1/offer.
 *
 * Shows Tom's full Protocol example with content blurred for privacy. The
 * user sees the extent of the deliverables (7 sections, real structure)
 * but cannot read the detailed content until they pay. Acts as a soft
 * upsell pivot before the offer page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sid: string }> }
) {
  const { sid } = await params;

  // Fetch the lead's answers so we can pass funnel context to the offer URL
  const { data: sessionData } = await supabaseAdmin
    .from("funnel_sessions")
    .select("answers")
    .eq("session_id", sid)
    .maybeSingle();

  const answers = (sessionData?.answers ?? {}) as Record<string, unknown>;

  // Build offer URL with the same quiz params the report uses, so the offer
  // page can personalize without needing a second hop.
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

  // Track the preview view (fire-and-forget — Netlify kills async after response)
  await supabaseAdmin.from("event_sessions").upsert(
    {
      session_id: sid,
      event: "protocol_preview_viewed",
      step: null,
      payload: { funnel_sid: sid },
      created_at: new Date().toISOString(),
    },
    { onConflict: "session_id,event,step" }
  );

  // Load + fill template
  const templatePath = path.join(process.cwd(), "data", "protocol-preview-template.html");
  let html = fs.readFileSync(templatePath, "utf-8");

  const replacements: Record<string, string> = {
    "{{CHECKOUT_URL}}": offerUrl,
    "{{FUNNEL_SID}}": sid,
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(key, value);
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
