/**
 * Phase 0 — Personalization quality test.
 *
 * Pulls every funnel session that has at least one of dream_outcome,
 * pain_friction, or trigger_moment populated. For each, calls the LLM
 * personalization engine and writes a markdown report to /tmp for
 * human review.
 *
 * Usage: npx tsx scripts/test-personalization.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ── Load .env.local ──────────────────────────────────────────────────
const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

// Imports AFTER env is loaded
import { createClient } from "@supabase/supabase-js";
import { generatePersonalization, type PersonalizationPayload } from "../lib/personalization";
import { getTestimonialById } from "../lib/testimonials";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

type SessionRow = {
  session_id: string;
  answers: Record<string, unknown>;
  created_at: string;
};

async function fetchLeadsWithFreeText(): Promise<SessionRow[]> {
  // Pull sessions where at least dream_outcome is filled.
  // We post-filter in JS to also include pain/trigger-only cases.
  const { data, error } = await supabase
    .from("funnel_sessions")
    .select("session_id, answers, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  if (!data) return [];

  return (data as SessionRow[]).filter((s) => {
    const a = s.answers ?? {};
    return Boolean(
      (a.dream_outcome as string)?.trim() ||
        (a.pain_friction as string)?.trim() ||
        (a.trigger_moment as string)?.trim(),
    );
  });
}

function summarize(s: SessionRow): string {
  const a = s.answers ?? {};
  const parts = [
    a.first_name ? `Name: ${a.first_name}` : "Name: (anon)",
    a.age_bracket ? `Age: ${a.age_bracket}` : null,
    a.morphology ? `Morpho: ${a.morphology}` : null,
    a.sexual_orientation ? `Orientation: ${a.sexual_orientation}` : null,
    a.social_environment ? `Env: ${a.social_environment}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function renderPayload(p: PersonalizationPayload): string {
  const testi = getTestimonialById(p.testimonial_id);
  return [
    `**persona_tag**: \`${p.persona_tag}\``,
    "",
    `**hero_subtitle**:`,
    `> ${p.hero_subtitle}`,
    "",
    `**testimonial picked**: \`${p.testimonial_id}\` (${testi.name})`,
    `> ${testi.quote}`,
    `> — ${testi.name}, ${testi.meta}`,
    "",
    `**lp_hero_h1**:`,
    `> ${p.lp_hero_h1_pre}**${p.lp_hero_h1_em}**`,
    "",
    `**lp_hero_desc**:`,
    `> ${p.lp_hero_desc}`,
  ].join("\n");
}

async function main() {
  console.log("Pulling sessions with free-text answers...");
  const leads = await fetchLeadsWithFreeText();
  console.log(`Found ${leads.length} leads with at least one free-text field.\n`);

  const out: string[] = [];
  out.push(`# Personalization samples — Phase 0 review`);
  out.push("");
  out.push(`Generated: ${new Date().toISOString()}`);
  out.push(`Model: claude-sonnet-4-6`);
  out.push(`Leads: ${leads.length}`);
  out.push("");
  out.push(`---`);
  out.push("");

  for (let i = 0; i < leads.length; i++) {
    const s = leads[i];
    const a = s.answers ?? {};
    const firstName = (a.first_name as string) ?? "(anon)";

    console.log(`[${i + 1}/${leads.length}] ${firstName} (${s.session_id.slice(0, 8)}...)`);

    out.push(`## Lead ${i + 1} — ${firstName}`);
    out.push("");
    out.push(`- session_id: \`${s.session_id}\``);
    out.push(`- profile: ${summarize(s)}`);
    out.push(`- created: ${s.created_at}`);
    out.push("");
    out.push(`### Raw free-text input`);
    out.push("");
    if (a.dream_outcome) {
      out.push(`**Dream:**`);
      out.push(`> ${a.dream_outcome}`);
      out.push("");
    }
    if (a.pain_friction) {
      out.push(`**Pain:**`);
      out.push(`> ${a.pain_friction}`);
      out.push("");
    }
    if (a.trigger_moment) {
      out.push(`**Trigger:**`);
      out.push(`> ${a.trigger_moment}`);
      out.push("");
    }

    out.push(`### LLM personalization output`);
    out.push("");

    const result = await generatePersonalization({
      first_name: a.first_name as string | undefined,
      age_bracket: a.age_bracket as string | undefined,
      morphology: a.morphology as string | undefined,
      ethnicity: a.ethnicity as string | undefined,
      sexual_orientation: a.sexual_orientation as string | undefined,
      social_environment: a.social_environment as string | undefined,
      weekly_time: a.weekly_time as string | undefined,
      past_solutions: Array.isArray(a.past_solutions)
        ? (a.past_solutions as string[]).join(", ")
        : (a.past_solutions as string | undefined),
      expected_results: Array.isArray(a.expected_results)
        ? (a.expected_results as string[]).join(", ")
        : (a.expected_results as string | undefined),
      dream_outcome: a.dream_outcome as string | undefined,
      pain_friction: a.pain_friction as string | undefined,
      trigger_moment: a.trigger_moment as string | undefined,
    });

    if (result.kind === "skipped") {
      out.push(`_skipped: ${result.reason}_`);
    } else if (result.kind === "error") {
      out.push(`**ERROR**: ${result.reason}`);
      console.error(`  ERROR: ${result.reason}`);
    } else {
      out.push(renderPayload(result.payload));
      out.push("");
      if (result.issues.length > 0) {
        out.push(`### ⚠️ Validation issues`);
        out.push("");
        for (const issue of result.issues) {
          out.push(`- **${issue.field}**: ${issue.reason}`);
        }
        console.warn(`  ⚠️  ${result.issues.length} validation issues`);
      } else {
        out.push(`_✅ no validation issues_`);
      }
    }

    out.push("");
    out.push("---");
    out.push("");
  }

  const path = "/tmp/personalization-samples.md";
  writeFileSync(path, out.join("\n"), "utf-8");
  console.log(`\n✅ Wrote ${leads.length} samples to ${path}`);
  console.log(`\nOpen with:\n  open ${path}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
