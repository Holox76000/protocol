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

// Atomically claim leads due for `step`. Fetches candidates, then updates
// only rows where the target column is still NULL — Postgres row-level locks
// under READ COMMITTED guarantee each lead is claimed by exactly one run,
// even when this endpoint is fired in parallel. The returned rows are the
// ones we own and must process.
async function claimDueLeads(step: StepKey, now: Date): Promise<LeadRow[]> {
  const col = STEP_COL[step];
  const cutoff = new Date(now.getTime() - DELAYS[step]).toISOString();

  // Use nurture_starts_at (not created_at) so legacy leads onboarded after
  // the sequence shipped progress at the same 24h cadence as fresh leads.
  const candidateQuery = supabaseAdmin
    .from("leads")
    .select("email")
    .is("nurture_paused_at", null)
    .is(col, null)
    .lte("nurture_starts_at", cutoff)
    .limit(BATCH_LIMIT);

  const stepIndex = Number(step.slice(1));
  if (stepIndex > 2) {
    const prevCol = STEP_COL[`E${stepIndex - 1}` as StepKey];
    candidateQuery.not(prevCol, "is", null);
  }

  const { data: candidates, error: cErr } = await candidateQuery;
  if (cErr) {
    console.error(`[cron/lead-nurture] candidate fetch ${step} failed`, { error: cErr.message });
    return [];
  }
  if (!candidates || candidates.length === 0) return [];

  const emails = candidates.map((c) => (c as { email: string }).email);

  const claimQuery = supabaseAdmin
    .from("leads")
    .update({ [col]: now.toISOString() })
    .in("email", emails)
    .is(col, null)
    .is("nurture_paused_at", null)
    .lte("nurture_starts_at", cutoff);

  if (stepIndex > 2) {
    const prevCol = STEP_COL[`E${stepIndex - 1}` as StepKey];
    claimQuery.not(prevCol, "is", null);
  }

  const { data: claimed, error: uErr } = await claimQuery.select("email, payload, created_at");
  if (uErr) {
    console.error(`[cron/lead-nurture] claim ${step} failed`, { error: uErr.message });
    return [];
  }
  return (claimed ?? []) as LeadRow[];
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
  // claimDueLeads already marked the target column, so a concurrent run of
  // this endpoint cannot re-select these leads. If the send below fails we
  // do not retry — matches the prior "mark before send" contract.
  const leads = await claimDueLeads(step, now);
  results[step] = { sent: 0, skipped: 0, failed: 0 };

  for (const lead of leads) {
    if (await isPaidOrSuppressed(lead.email)) {
      results[step].skipped++;
      // Pause this lead to skip future steps too. The step column is already
      // marked from the claim; the pause overrides it going forward.
      await supabaseAdmin
        .from("leads")
        .update({ nurture_paused_at: now.toISOString() })
        .eq("email", lead.email);
      continue;
    }

    const funnelSid = (lead.payload?.funnel_sid as string | undefined) ?? undefined;
    if (!funnelSid) {
      // Skip — we can't personalize without funnel_sid. Column already marked.
      results[step].skipped++;
      continue;
    }

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
