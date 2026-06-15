/**
 * Protocol Club — MCP Data Server
 *
 * Tools: leads, funnel_stats, lead_detail, customers, revenue, payments, meta_ads
 *
 * Usage in Claude settings:
 *   "protocol-data": {
 *     "command": "node",
 *     "args": ["/absolute/path/to/mcp/server.mjs"],
 *     "env": { ...keys from .env.local... }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// ── Clients ────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const META_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID; // optional — set to "act_XXXXXXXXX"

// ── Helpers ────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function fmtDate(iso) {
  return iso ? iso.slice(0, 10) : "—";
}

function table(rows, cols) {
  if (!rows.length) return "(no data)";
  const header = cols.map(c => c.label.padEnd(c.width)).join("  ");
  const sep = cols.map(c => "─".repeat(c.width)).join("  ");
  const lines = rows.map(r =>
    cols.map(c => String(r[c.key] ?? "—").slice(0, c.width).padEnd(c.width)).join("  ")
  );
  return [header, sep, ...lines].join("\n");
}

// ── Server ─────────────────────────────────────────────────

const server = new McpServer({ name: "protocol-data", version: "1.0.0" });

// ─────────────────────────────────────────────────────────
// LEADS
// ─────────────────────────────────────────────────────────

server.tool(
  "leads",
  "Quiz leads collected over the last N days — with name, email, UTM source, ad creative and quiz answers summary.",
  { days: z.number().int().min(1).max(90).default(7).describe("Number of days to look back") },
  async ({ days }) => {
    const since = daysAgo(days);
    const { data, error } = await supabase
      .from("leads")
      .select("email, payload, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    if (!data.length) return { content: [{ type: "text", text: `No leads in the last ${days} days.` }] };

    const rows = data.map(r => {
      const p = r.payload ?? {};
      const a = p.answers ?? {};
      const u = p.utm ?? {};
      return {
        date: fmtDate(r.created_at),
        name: a.first_name ?? "—",
        email: r.email,
        src: u.utm_source ?? "—",
        campaign: u.utm_campaign ?? "—",
        morpho: a.morphology ?? "—",
        age: a.age_bracket ?? "—",
        past: Array.isArray(a.past_solutions)
          ? a.past_solutions.join(", ")
          : (a.past_solutions ?? "—"),
        wants: Array.isArray(a.expected_results)
          ? a.expected_results.slice(0, 2).join(", ")
          : (a.expected_results ?? "—"),
      };
    });

    const summary = `${data.length} leads in the last ${days} days\n\n`;
    const t = table(rows, [
      { key: "date",     label: "Date",     width: 10 },
      { key: "name",     label: "Name",     width: 12 },
      { key: "email",    label: "Email",    width: 28 },
      { key: "src",      label: "Source",   width: 8  },
      { key: "morpho",   label: "Body type",width: 12 },
      { key: "age",      label: "Age",      width: 7  },
      { key: "past",     label: "Tried before",     width: 22 },
      { key: "wants",    label: "Wants",    width: 30 },
    ]);

    return { content: [{ type: "text", text: summary + t }] };
  }
);

// ─────────────────────────────────────────────────────────
// LEAD DETAIL
// ─────────────────────────────────────────────────────────

server.tool(
  "lead_detail",
  "Full quiz profile for a specific lead — all answers, UTM attribution, session ID.",
  { email: z.string().email().describe("Email address of the lead") },
  async ({ email }) => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    if (!data.length) return { content: [{ type: "text", text: `No lead found for ${email}` }] };

    const r = data[0];
    const p = r.payload ?? {};
    const a = p.answers ?? {};
    const u = p.utm ?? {};

    const lines = [
      `Lead: ${email}`,
      `Created: ${fmtDate(r.created_at)}`,
      `Funnel session ID: ${p.funnel_sid ?? "—"}`,
      ``,
      `── UTM Attribution ─────────────────`,
      `Source:   ${u.utm_source ?? "—"}`,
      `Campaign: ${u.utm_campaign ?? "—"}`,
      `Ad ID:    ${u.utm_content ?? "—"}`,
      `fbclid:   ${u.fbclid ? "present" : "absent"}`,
      ``,
      `── Quiz Answers ────────────────────`,
      `Name:           ${a.first_name ?? "—"}`,
      `Age bracket:    ${a.age_bracket ?? "—"}`,
      `Ethnicity:      ${a.ethnicity ?? "—"}`,
      `Body type:      ${a.morphology ?? "—"}`,
      `Confidence hit: ${a.shape_impact ?? "—"}`,
      `Pain since:     ${a.pain_timeline ?? "—"}`,
      `Height:         ${a.height_unit === "cm" ? `${a.height_cm}cm` : `${a.height_ft ?? "—"}'${a.height_in ?? "—"}"`}`,
      `Weight:         ${a.weight_value ?? "—"} ${a.weight_unit ?? ""}`,
      `Time/week:      ${a.weekly_time ?? "—"}`,
      `Environment:    ${a.social_environment ?? "—"}`,
      `Tried before:   ${Array.isArray(a.past_solutions) ? a.past_solutions.join(", ") : (a.past_solutions ?? "—")}`,
      `Wants:          ${Array.isArray(a.expected_results) ? a.expected_results.join(", ") : (a.expected_results ?? "—")}`,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ─────────────────────────────────────────────────────────
// FUNNEL STATS
// ─────────────────────────────────────────────────────────

server.tool(
  "funnel_stats",
  "Funnel session stats — sessions per day, completion rates per quiz step, and lead conversion rate.",
  { days: z.number().int().min(1).max(90).default(7).describe("Number of days to look back") },
  async ({ days }) => {
    const since = daysAgo(days);
    const { data, error } = await supabase
      .from("funnel_sessions")
      .select("answers, created_at")
      .gte("created_at", since)
      .limit(1000);

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

    const total = data.length;
    if (!total) return { content: [{ type: "text", text: `No funnel sessions in the last ${days} days.` }] };

    // Sessions per day
    const byDay = {};
    for (const r of data) {
      const day = fmtDate(r.created_at);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }

    // Step completion (keys that signal user reached that step)
    const steps = [
      { key: "age_bracket",      label: "Q1 Âge" },
      { key: "morphology",       label: "Q3 Body type" },
      { key: "expected_results", label: "Q6 What to change" },
      { key: "height_unit",      label: "Q7 Height" },
      { key: "weight_value",     label: "Q8 Weight" },
      { key: "weekly_time",      label: "Q9 Time/week" },
      { key: "social_environment", label: "Q10 Environment" },
      { key: "past_solutions",   label: "Q11 Past solutions" },
      { key: "email",            label: "OPTIN Email" },
    ];

    const stepCounts = steps.map(s => {
      const cnt = data.filter(r => {
        const a = r.answers;
        return a && typeof a === "object" && a[s.key];
      }).length;
      return { ...s, cnt, pct: Math.round(cnt / total * 100) };
    });

    const { data: leads } = await supabase
      .from("leads")
      .select("created_at")
      .gte("created_at", since);

    const leadCount = leads?.length ?? 0;

    const lines = [
      `Funnel — last ${days} days`,
      `Total sessions: ${total}  |  Leads (optin): ${leadCount}  |  Lead rate: ${Math.round(leadCount/total*100)}%`,
      ``,
      `── Sessions per day ────────────────`,
      ...Object.entries(byDay).sort().map(([d, n]) => `${d}: ${n}`),
      ``,
      `── Step completion (% of all sessions) ─`,
      ...stepCounts.map(s => `${String(s.pct).padStart(3)}%  (${String(s.cnt).padStart(3)}/${total})  ${s.label}`),
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ─────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────

server.tool(
  "customers",
  "Paid customers — name, email, questionnaire status, purchase date.",
  { limit: z.number().int().min(1).max(100).default(20).describe("Max number of customers to return") },
  async ({ limit }) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, has_paid, created_at, questionnaire_submitted_at")
      .eq("has_paid", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    if (!data.length) return { content: [{ type: "text", text: "No paid customers found." }] };

    const rows = data.map(r => ({
      date:       fmtDate(r.created_at),
      name:       r.first_name ?? "—",
      email:      r.email,
      questionnaire: r.questionnaire_submitted_at ? "submitted" : "pending",
    }));

    const t = table(rows, [
      { key: "date",          label: "Purchase date",   width: 12 },
      { key: "name",          label: "Name",            width: 14 },
      { key: "email",         label: "Email",           width: 30 },
      { key: "questionnaire", label: "Questionnaire",   width: 13 },
    ]);

    return { content: [{ type: "text", text: `${data.length} customers\n\n${t}` }] };
  }
);

// ─────────────────────────────────────────────────────────
// STRIPE REVENUE
// ─────────────────────────────────────────────────────────

server.tool(
  "revenue",
  "Stripe revenue summary — total collected, number of payments, average ticket, for the last N days.",
  { days: z.number().int().min(1).max(365).default(30).describe("Number of days to look back") },
  async ({ days }) => {
    const since = Math.floor(Date.now() / 1000) - days * 86400;

    const charges = await stripe.paymentIntents.list({
      created: { gte: since },
      limit: 100,
    });

    const succeeded = charges.data.filter(p => p.status === "succeeded");
    const total = succeeded.reduce((s, p) => s + p.amount_received, 0);
    const avg = succeeded.length ? Math.round(total / succeeded.length) : 0;

    // By day
    const byDay = {};
    for (const p of succeeded) {
      const d = new Date(p.created * 1000).toISOString().slice(0, 10);
      byDay[d] = (byDay[d] ?? 0) + p.amount_received;
    }

    const lines = [
      `Revenue — last ${days} days`,
      `Total: $${(total / 100).toFixed(2)}  |  Payments: ${succeeded.length}  |  Avg ticket: $${(avg / 100).toFixed(2)}`,
      ``,
      `── Per day ────────────────────────`,
      ...Object.entries(byDay).sort().map(([d, amt]) => `${d}: $${(amt / 100).toFixed(2)}`),
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ─────────────────────────────────────────────────────────
// STRIPE PAYMENTS
// ─────────────────────────────────────────────────────────

server.tool(
  "payments",
  "Recent Stripe payments — amount, customer email, date, status.",
  { limit: z.number().int().min(1).max(50).default(10).describe("Number of recent payments") },
  async ({ limit }) => {
    const intents = await stripe.paymentIntents.list({ limit });
    const rows = intents.data.map(p => ({
      date:   new Date(p.created * 1000).toISOString().slice(0, 10),
      amount: `$${(p.amount_received / 100).toFixed(2)}`,
      status: p.status,
      email:  p.receipt_email ?? p.metadata?.email ?? "—",
    }));

    const t = table(rows, [
      { key: "date",   label: "Date",   width: 12 },
      { key: "amount", label: "Amount", width: 8  },
      { key: "status", label: "Status", width: 12 },
      { key: "email",  label: "Email",  width: 30 },
    ]);

    return { content: [{ type: "text", text: t }] };
  }
);

// ─────────────────────────────────────────────────────────
// META ADS PERFORMANCE
// ─────────────────────────────────────────────────────────

server.tool(
  "meta_ads",
  "Meta Ads performance — spend, impressions, CPM, CTR, leads per ad. Requires META_AD_ACCOUNT_ID env var (format: act_XXXXXXXXX).",
  {
    date_preset: z.enum([
      "today", "yesterday", "last_7d", "last_14d", "last_30d", "this_month", "last_month"
    ]).default("last_7d").describe("Date range preset"),
    level: z.enum(["campaign", "adset", "ad"]).default("ad").describe("Breakdown level"),
  },
  async ({ date_preset, level }) => {
    if (!META_AD_ACCOUNT) {
      return {
        content: [{
          type: "text",
          text: [
            "META_AD_ACCOUNT_ID is not set.",
            "Add it to the MCP server env config in .claude/settings.json:",
            '  "META_AD_ACCOUNT_ID": "act_XXXXXXXXX"',
            "",
            "Find your account ID in Meta Business Suite → Settings → Ad Accounts.",
          ].join("\n"),
        }],
      };
    }

    const fields = [
      "campaign_name", "adset_name", "ad_name", "ad_id",
      "spend", "impressions", "clicks", "cpm", "ctr",
      "actions",
    ].join(",");

    const url = `https://graph.facebook.com/v22.0/${META_AD_ACCOUNT}/insights?` +
      `fields=${fields}&level=${level}&date_preset=${date_preset}&limit=50` +
      `&access_token=${META_TOKEN}`;

    const res = await fetch(url);
    const json = await res.json();

    if (json.error) {
      return { content: [{ type: "text", text: `Meta API error: ${json.error.message}` }] };
    }

    const ads = json.data ?? [];
    if (!ads.length) return { content: [{ type: "text", text: "No ad data for this period." }] };

    const lines = [`Meta Ads — ${date_preset} — by ${level}`, ""];

    for (const ad of ads) {
      const leads = (ad.actions ?? []).find(a => a.action_type === "lead")?.value ?? 0;
      const cpl = leads > 0 ? (parseFloat(ad.spend) / leads).toFixed(2) : "—";
      lines.push(
        `${ad.ad_name ?? ad.adset_name ?? ad.campaign_name}`,
        `  Spend: $${parseFloat(ad.spend).toFixed(2)}  |  Impr: ${ad.impressions}  |  CTR: ${parseFloat(ad.ctr ?? 0).toFixed(2)}%  |  Leads: ${leads}  |  CPL: $${cpl}`,
        ""
      );
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ─────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
