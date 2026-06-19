/**
 * Test accéléré de la séquence email nurture + cart.
 * Envoie les 8 emails (cart E1, cart E2, nurture E2-E7) à un email cible
 * en utilisant la perso réelle d'un funnel_sid existant.
 *
 * Usage:
 *   npx tsx scripts/test-nurture-sequence.ts <email> <funnel_sid>
 *   npx tsx scripts/test-nurture-sequence.ts patrypierreandre@gmail.com fb530e36-25e5-40dd-93dc-0cbc2f1bdae8
 *
 * Optionnel : passer --delay <secondes> pour espacer les envois (défaut : 3s).
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Bootstrap env from .env.local before any other import that reads process.env.
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
} catch {
  // ignore — env may be set via shell
}

// Lazy-imported after env bootstrap so resend / supabase clients see the keys.
async function loadEmail() {
  return import("../lib/email.js");
}

const TEN_YEARS = 315_360_000;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith("--"));
  const flags = process.argv.slice(2).filter(a => a.startsWith("--"));
  const delaySec = Number(flags.find(f => f.startsWith("--delay"))?.split("=")[1] ?? 3);

  const [email, funnelSid] = args;
  if (!email || !funnelSid) {
    console.error("Usage: npx tsx scripts/test-nurture-sequence.ts <email> <funnel_sid> [--delay=3]");
    process.exit(1);
  }

  console.log(`▶ Test sequence → ${email}`);
  console.log(`   funnel_sid    = ${funnelSid}`);
  console.log(`   delay between = ${delaySec}s`);
  console.log("");

  // Pull real personalization data from Supabase.
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const { data: session } = await sb
    .from("funnel_sessions")
    .select("answers")
    .eq("session_id", funnelSid)
    .maybeSingle();

  if (!session) {
    console.error(`❌ funnel_session ${funnelSid} not found`);
    process.exit(1);
  }

  const answers = session.answers as Record<string, unknown>;
  const firstName         = (answers.first_name         as string | undefined) ?? "there";
  const morphology        = (answers.morphology         as string | undefined) ?? "Average";
  const ageBracket        = (answers.age_bracket        as string | undefined) ?? "20–29";
  const socialEnvironment = (answers.social_environment as string | undefined) ?? "";
  const sexualOrientation = (answers.sexual_orientation as string | undefined) ?? undefined;
  const pastSolutions     = (answers.past_solutions     as string | string[] | undefined) ?? [];

  console.log(`📋 Perso loaded:`);
  console.log(`   firstName         = ${firstName}`);
  console.log(`   morphology        = ${morphology}`);
  console.log(`   age_bracket       = ${ageBracket}`);
  console.log(`   social_env        = ${socialEnvironment || "(empty)"}`);
  console.log(`   sexual_orientation= ${sexualOrientation || "(empty)"}`);
  console.log(`   past_solutions    = ${JSON.stringify(pastSolutions)}`);
  console.log("");

  // Pull AI photo analysis + before/after URLs (used by E4, E6).
  const { data: preview } = await sb
    .from("visualization_previews")
    .select("before_path, after_path, analysis_text")
    .eq("preview_id", funnelSid)
    .maybeSingle();

  let beforeUrl: string | null = null;
  let afterUrl: string | null = null;
  let analysisText: string | null = null;

  if (preview) {
    analysisText = (preview.analysis_text as string | null) ?? null;
    const beforePath = preview.before_path as string | null;
    const afterPath  = preview.after_path  as string | null;
    if (beforePath && afterPath && !afterPath.startsWith("__")) {
      const [b, a] = await Promise.all([
        sb.storage.from("user-photos").createSignedUrl(beforePath, TEN_YEARS),
        sb.storage.from("user-photos").createSignedUrl(afterPath,  TEN_YEARS),
      ]);
      beforeUrl = b.data?.signedUrl ?? null;
      afterUrl  = a.data?.signedUrl ?? null;
    }
  }

  console.log(`🖼  Photos: before=${beforeUrl ? "✓" : "—"}  after=${afterUrl ? "✓" : "—"}  analysis_text=${analysisText ? "✓" : "—"}`);
  console.log("");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://protocol-club.com";
  const reportUrl   = `${baseUrl}/f1/report/${funnelSid}`;
  const offerUrl    = `${baseUrl}/f1/offer?funnel_sid=${funnelSid}&funnel=quiz`;
  const checkoutUrl = `${baseUrl}/f1/offer?funnel_sid=${funnelSid}&funnel=quiz`;

  const {
    sendNurtureWedgeEmail,
    sendNurtureInsightEmail,
    sendNurtureMirrorEmail,
    sendNurtureStakesEmail,
    sendNurtureProjectionEmail,
    sendNurtureBreakupEmail,
    sendAbandonedCartEmail,
  } = await loadEmail();

  type Step = {
    label: string;
    run: () => Promise<unknown>;
  };

  const steps: Step[] = [
    {
      label: "Cart E1 (+10min equivalent) — body wedge",
      run: () => sendAbandonedCartEmail({
        email, firstName, checkoutUrl, emailNumber: 1, morphology, pastSolutions,
      }),
    },
    {
      label: "Cart E2 (+4h equivalent) — pattern actionable",
      run: () => sendAbandonedCartEmail({
        email, firstName, checkoutUrl, emailNumber: 2, morphology, pastSolutions,
      }),
    },
    {
      label: "Nurture E2 — Wedge past_solutions",
      run: () => sendNurtureWedgeEmail({ email, firstName, pastSolutions, reportUrl }),
    },
    {
      label: "Nurture E3 — Insight pattern p2",
      run: () => sendNurtureInsightEmail({ email, firstName, morphology, offerUrl }),
    },
    {
      label: "Nurture E4 — Mirror social",
      run: () => sendNurtureMirrorEmail({
        email, firstName, morphology, ageBracket, analysisText, offerUrl,
      }),
    },
    {
      label: "Nurture E5 — Stakes contextuels",
      run: () => sendNurtureStakesEmail({
        email, firstName, socialEnvironment, ageBracket, sexualOrientation, offerUrl,
      }),
    },
    {
      label: "Nurture E6 — Projection",
      run: () => sendNurtureProjectionEmail({
        email, firstName, morphology, beforeUrl, afterUrl, offerUrl,
      }),
    },
    {
      label: "Nurture E7 — Breakup",
      run: () => sendNurtureBreakupEmail({ email, firstName }),
    },
  ];

  const results: { label: string; ok: boolean; error?: string }[] = [];

  for (const step of steps) {
    process.stdout.write(`→ ${step.label}  ... `);
    try {
      await step.run();
      console.log("✓ sent");
      results.push({ label: step.label, ok: true });
    } catch (err) {
      console.log(`✗ FAILED`);
      console.error("   ", err);
      results.push({ label: step.label, ok: false, error: String(err) });
    }
    if (delaySec > 0) await sleep(delaySec * 1000);
  }

  console.log("");
  console.log("──── SUMMARY ────");
  for (const r of results) {
    console.log(`  ${r.ok ? "✓" : "✗"}  ${r.label}`);
  }
  const failed = results.filter(r => !r.ok).length;
  console.log("");
  console.log(failed === 0 ? `✅ All ${results.length} emails sent.` : `⚠ ${failed}/${results.length} failed.`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
