import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import {
  sendNurtureWedgeEmail,
  sendNurtureInsightEmail,
  sendNurtureMirrorEmail,
  sendNurtureStakesEmail,
  sendNurtureProjectionEmail,
  sendNurtureBreakupEmail,
} from "../../../../lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://protocol-club.com";

const HOUR = 60 * 60 * 1000;
const DAY  = 24 * HOUR;

const DELAYS: Record<"E2" | "E3" | "E4" | "E5" | "E6" | "E7", number> = {
  E2: 24 * HOUR,
  E3: 48 * HOUR,
  E4: 72 * HOUR,
  E5: 5  * DAY,
  E6: 8  * DAY,
  E7: 13 * DAY,
};

// Cap per cron run during warmup. Adjustable via env.
const BATCH_LIMIT = Number(process.env.LEAD_NURTURE_BATCH ?? 20);

const TEN_YEARS = 315_360_000;

type LeadRow = {
  email: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type FunnelAnswers = Record<string, unknown>;

async function fetchAnswers(funnelSid: string): Promise<FunnelAnswers | null> {
  const { data } = await supabaseAdmin
    .from("funnel_sessions")
    .select("answers")
    .eq("session_id", funnelSid)
    .maybeSingle();
  return (data?.answers ?? null) as FunnelAnswers | null;
}

async function fetchPhotoUrls(funnelSid: string): Promise<{ beforeUrl: string | null; afterUrl: string | null; analysisText: string | null }> {
  const { data } = await supabaseAdmin
    .from("visualization_previews")
    .select("before_path, after_path, analysis_text")
    .eq("preview_id", funnelSid)
    .maybeSingle();

  if (!data) return { beforeUrl: null, afterUrl: null, analysisText: null };

  const beforePath = data.before_path as string | null;
  const afterPath  = data.after_path  as string | null;

  if (!beforePath || !afterPath || afterPath.startsWith("__")) {
    return { beforeUrl: null, afterUrl: null, analysisText: (data.analysis_text as string | null) ?? null };
  }

  const [b, a] = await Promise.all([
    supabaseAdmin.storage.from("user-photos").createSignedUrl(beforePath, TEN_YEARS),
    supabaseAdmin.storage.from("user-photos").createSignedUrl(afterPath,  TEN_YEARS),
  ]);

  return {
    beforeUrl: b.data?.signedUrl ?? null,
    afterUrl:  a.data?.signedUrl ?? null,
    analysisText: (data.analysis_text as string | null) ?? null,
  };
}

async function isPaidOrSuppressed(email: string): Promise<boolean> {
  const normalized = email.toLowerCase();
  const [supRes, paidRes] = await Promise.all([
    supabaseAdmin.from("email_suppressions").select("email").eq("email", normalized).maybeSingle(),
    supabaseAdmin.from("users").select("id").eq("email", normalized).eq("has_paid", true).maybeSingle(),
  ]);
  return Boolean(supRes.data || paidRes.data);
}

type StepKey = keyof typeof DELAYS;

const STEP_COL: Record<StepKey, string> = {
  E2: "nurture_e2_sent_at",
  E3: "nurture_e3_sent_at",
  E4: "nurture_e4_sent_at",
  E5: "nurture_e5_sent_at",
  E6: "nurture_e6_sent_at",
  E7: "nurture_e7_sent_at",
};

async function fetchDueLeads(step: StepKey, now: Date): Promise<LeadRow[]> {
  const col = STEP_COL[step];
  const cutoff = new Date(now.getTime() - DELAYS[step]).toISOString();

  // Use nurture_starts_at (not created_at) so legacy leads onboarded after
  // the sequence shipped progress at the same 24h cadence as fresh leads.
  const query = supabaseAdmin
    .from("leads")
    .select("email, payload, created_at")
    .is("nurture_paused_at", null)
    .is(col, null)
    .lte("nurture_starts_at", cutoff)
    .limit(BATCH_LIMIT);

  // For steps after E2, only consider leads that already received the previous step.
  const stepIndex = Number(step.slice(1));
  if (stepIndex > 2) {
    const prevCol = STEP_COL[`E${stepIndex - 1}` as StepKey];
    query.not(prevCol, "is", null);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`[cron/lead-nurture] fetch ${step} failed`, { error: error.message });
    return [];
  }
  return (data ?? []) as LeadRow[];
}

async function markSent(step: StepKey, email: string, now: Date) {
  const col = STEP_COL[step];
  await supabaseAdmin
    .from("leads")
    .update({ [col]: now.toISOString() })
    .eq("email", email);
}

function offerUrl(funnelSid: string | undefined, answers: FunnelAnswers | null): string {
  const params = new URLSearchParams({ funnel: "quiz" });
  if (funnelSid) params.set("funnel_sid", funnelSid);
  if (answers) {
    const keys = ["morphology", "ethnicity", "age_bracket", "social_environment",
                  "weekly_time", "sexual_orientation", "first_name"];
    for (const k of keys) {
      const v = answers[k];
      if (v != null) params.set(k, Array.isArray(v) ? v.join("|") : String(v));
    }
  }
  return `${SITE_URL}/f1/offer?${params.toString()}`;
}

function reportUrl(funnelSid: string): string {
  return `${SITE_URL}/f1/report/${funnelSid}`;
}

async function processStep(step: StepKey, now: Date, results: Record<string, { sent: number; skipped: number; failed: number }>) {
  const leads = await fetchDueLeads(step, now);
  results[step] = { sent: 0, skipped: 0, failed: 0 };

  for (const lead of leads) {
    // Idempotence: mark sent before the send. If the send fails we still skip retry.
    if (await isPaidOrSuppressed(lead.email)) {
      results[step].skipped++;
      // Pause this lead to skip future steps too.
      await supabaseAdmin
        .from("leads")
        .update({ nurture_paused_at: now.toISOString() })
        .eq("email", lead.email);
      continue;
    }

    const funnelSid = (lead.payload?.funnel_sid as string | undefined) ?? undefined;
    if (!funnelSid) {
      // Mark sent (skip) — we can't personalize without funnel_sid.
      await markSent(step, lead.email, now);
      results[step].skipped++;
      continue;
    }

    await markSent(step, lead.email, now);

    try {
      const answers = await fetchAnswers(funnelSid);
      const firstName = (answers?.first_name as string | undefined) ?? undefined;
      const morphology = (answers?.morphology as string | undefined) ?? undefined;
      const ageBracket = (answers?.age_bracket as string | undefined) ?? undefined;
      const socialEnvironment = (answers?.social_environment as string | undefined) ?? undefined;
      const sexualOrientation = (answers?.sexual_orientation as string | undefined) ?? undefined;
      const pastSolutions = (answers?.past_solutions as string | string[] | undefined) ?? undefined;

      const offer = offerUrl(funnelSid, answers);

      if (step === "E2") {
        await sendNurtureWedgeEmail({
          email: lead.email, firstName, pastSolutions,
          reportUrl: reportUrl(funnelSid),
        });
      } else if (step === "E3") {
        await sendNurtureInsightEmail({
          email: lead.email, firstName, morphology, offerUrl: offer,
        });
      } else if (step === "E4") {
        const photo = await fetchPhotoUrls(funnelSid);
        await sendNurtureMirrorEmail({
          email: lead.email, firstName, morphology, ageBracket,
          analysisText: photo.analysisText, offerUrl: offer,
        });
      } else if (step === "E5") {
        await sendNurtureStakesEmail({
          email: lead.email, firstName, socialEnvironment, ageBracket,
          sexualOrientation, offerUrl: offer,
        });
      } else if (step === "E6") {
        const photo = await fetchPhotoUrls(funnelSid);
        await sendNurtureProjectionEmail({
          email: lead.email, firstName, morphology,
          beforeUrl: photo.beforeUrl, afterUrl: photo.afterUrl, offerUrl: offer,
        });
      } else if (step === "E7") {
        await sendNurtureBreakupEmail({ email: lead.email, firstName });
      }

      results[step].sent++;
    } catch (err) {
      results[step].failed++;
      console.error(`[cron/lead-nurture] ${step} send failed`, { email: lead.email, error: String(err) });
    }
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Killed by default — the fetch→markSent→send loop races when the scheduler
  // fires this endpoint in parallel, causing 2-3× sends per lead. Set
  // LEAD_NURTURE_ENABLED=1 in Netlify env once an atomic per-lead claim ships.
  if (process.env.LEAD_NURTURE_ENABLED !== "1") {
    console.log("[cron/lead-nurture] kill switch active — no-op");
    return NextResponse.json({ ok: true, killed: true });
  }

  const now = new Date();
  const results: Record<string, { sent: number; skipped: number; failed: number }> = {};

  // Process from latest step back to earliest so a lead doesn't progress
  // through multiple steps in a single run.
  for (const step of ["E7", "E6", "E5", "E4", "E3", "E2"] as StepKey[]) {
    await processStep(step, now, results);
  }

  console.log("[cron/lead-nurture] done", results);
  return NextResponse.json({ ok: true, results });
}
