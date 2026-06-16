/**
 * Protocol Club — Remote MCP Server (Streamable HTTP transport)
 *
 * Implements JSON-RPC 2.0 / MCP protocol for Claude Desktop & Claude Code.
 * Auth: Authorization: Bearer <MCP_SECRET>
 *
 * Partner config (claude_desktop_config.json):
 * {
 *   "mcpServers": {
 *     "protocol-data": {
 *       "url": "https://protocol-club.com/api/mcp",
 *       "headers": { "Authorization": "Bearer <MCP_SECRET>" }
 *     }
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { verifyToken } from "../../../lib/mcp-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Clients ───────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

const META_TOKEN    = process.env.META_ACCESS_TOKEN!;
const META_ACCOUNT  = process.env.META_AD_ACCOUNT_ID!;

// ── Helpers ───────────────────────────────────────────────

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function fmtDate(iso: string | null | undefined) {
  return iso ? iso.slice(0, 10) : "—";
}

// Resolve since/until into ISO timestamps from a (days | since | until) input
function resolveWindow(args: Record<string, unknown>): { since: string; until: string; sinceDay: string; untilDay: string } {
  const today = new Date().toISOString().slice(0, 10);
  const untilDay = args.until ? String(args.until) : today;
  let sinceDay: string;
  if (args.since) {
    sinceDay = String(args.since);
  } else {
    const days = Number(args.days ?? 30);
    sinceDay = daysAgo(days).slice(0, 10);
  }
  return {
    since: `${sinceDay}T00:00:00Z`,
    until: `${untilDay}T23:59:59Z`,
    sinceDay,
    untilDay,
  };
}

// Monday of the ISO week containing this YYYY-MM-DD
function weekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function bucketOf(dateStr: string, breakdown: "day" | "week" | "month"): string {
  if (breakdown === "day")   return dateStr.slice(0, 10);
  if (breakdown === "week")  return weekStart(dateStr);
  return dateStr.slice(0, 7); // month
}

const INTERNAL_EMAIL_PATTERNS = [
  "patrypierreandre", "sofiane.lekfif", "thibault.cdn", "reddotgrowth",
];
function isInternalEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return INTERNAL_EMAIL_PATTERNS.some(p => lower.includes(p));
}

// Paginate Stripe payment_intents over a window — returns ALL matching
async function fetchAllPaymentIntents(stripe: Stripe, sinceTs: number, untilTs: number, statusFilter?: string) {
  const out: Stripe.PaymentIntent[] = [];
  let startingAfter: string | undefined;
  while (true) {
    const page: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list({
      created: { gte: sinceTs, lte: untilTs },
      limit: 100,
      starting_after: startingAfter,
    });
    for (const p of page.data) {
      if (statusFilter && statusFilter !== "all" && p.status !== statusFilter) continue;
      out.push(p);
    }
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }
  return out;
}

// Fetch Meta insights with time_increment, auto-paginate
async function fetchMetaInsights(opts: {
  level: string;
  fields: string;
  since?: string;
  until?: string;
  date_preset?: string;
  time_increment?: string;
}): Promise<Record<string, unknown>[]> {
  const qs = new URLSearchParams({
    access_token: META_TOKEN,
    fields: opts.fields,
    level: opts.level,
    limit: "200",
  });
  if (opts.since && opts.until) {
    qs.set("time_range", JSON.stringify({ since: opts.since, until: opts.until }));
  } else if (opts.date_preset) {
    qs.set("date_preset", opts.date_preset);
  }
  if (opts.time_increment && opts.time_increment !== "all") qs.set("time_increment", opts.time_increment);

  const out: Record<string, unknown>[] = [];
  let url = `https://graph.facebook.com/v22.0/${META_ACCOUNT}/insights?${qs.toString()}`;
  while (url) {
    const res = await fetch(url);
    const json = await res.json() as { data?: Record<string, unknown>[]; paging?: { next?: string }; error?: { message: string } };
    if (json.error) throw new Error(json.error.message);
    for (const row of json.data ?? []) out.push(row);
    url = json.paging?.next ?? "";
  }
  return out;
}

function table(rows: Record<string, unknown>[], cols: { key: string; label: string; width: number }[]) {
  if (!rows.length) return "(no data)";
  const header = cols.map(c => c.label.padEnd(c.width)).join("  ");
  const sep    = cols.map(c => "─".repeat(c.width)).join("  ");
  const lines  = rows.map(r =>
    cols.map(c => String(r[c.key] ?? "—").slice(0, c.width).padEnd(c.width)).join("  ")
  );
  return [header, sep, ...lines].join("\n");
}

// ── Tool definitions ──────────────────────────────────────

const TOOLS = [
  {
    name: "leads",
    description: "Quiz leads (optin email captured). Returns name, email, date, UTM source/campaign/ad, body type, past solutions, wants. Use `days` OR (`since`+`until`).",
    inputSchema: {
      type: "object",
      properties: {
        days:  { type: "integer", default: 30, minimum: 1, description: "Look back N days from today (no upper limit)" },
        since: { type: "string", description: "Custom start date YYYY-MM-DD (overrides days)" },
        until: { type: "string", description: "Custom end date YYYY-MM-DD (defaults to today)" },
        utm_source:   { type: "string", description: "Filter by utm_source (e.g. 'ig', 'fb')" },
        utm_campaign: { type: "string", description: "Filter by utm_campaign ID" },
        utm_content:  { type: "string", description: "Filter by utm_content (ad ID)" },
        exclude_internal: { type: "boolean", default: true, description: "Exclude internal test emails (patrypierreandre, sofiane.lekfif, etc.)" },
      },
    },
  },
  {
    name: "lead_detail",
    description: "Full quiz profile for one lead — all answers, UTM attribution, session ID.",
    inputSchema: {
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", description: "Email address of the lead" },
      },
    },
  },
  {
    name: "funnel_stats",
    description: "Funnel drop-off — sessions, step completion (Q1→Q11), optin, leads. Use `days` OR (`since`+`until`). Add `breakdown='week'` for weekly cohorts. Filter by UTM to isolate Meta-attributed sessions.",
    inputSchema: {
      type: "object",
      properties: {
        days:  { type: "integer", default: 30, minimum: 1, description: "Look back N days (no upper limit)" },
        since: { type: "string", description: "Custom start YYYY-MM-DD" },
        until: { type: "string", description: "Custom end YYYY-MM-DD" },
        breakdown: { type: "string", enum: ["total", "day", "week"], default: "total", description: "Aggregate level. 'week' returns per-week cohort funnels." },
        utm_source: { type: "string", description: "Filter to sessions whose lead matched this utm_source" },
      },
    },
  },
  {
    name: "customers",
    description: "Paid customers list — name, email, purchase date, questionnaire status.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", default: 20, minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: "revenue",
    description: "Stripe revenue summary (succeeded only by default). Total, average ticket, breakdown by day/week/month. Auto-excludes internal test payments. Auto-paginates — no limit.",
    inputSchema: {
      type: "object",
      properties: {
        days:  { type: "integer", default: 30, minimum: 1, description: "Look back N days (no upper limit)" },
        since: { type: "string", description: "Custom start YYYY-MM-DD" },
        until: { type: "string", description: "Custom end YYYY-MM-DD" },
        breakdown: { type: "string", enum: ["day", "week", "month"], default: "day" },
        include_internal: { type: "boolean", default: false, description: "Include internal test payments (patrypierreandre+...). Default false." },
      },
    },
  },
  {
    name: "payments",
    description: "Stripe payments list (succeeded by default). Auto-paginates over the full window. Returns amount, email, date, status, UTM source/campaign/ad from metadata.",
    inputSchema: {
      type: "object",
      properties: {
        days:  { type: "integer", default: 30, minimum: 1, description: "Look back N days (no upper limit)" },
        since: { type: "string", description: "Custom start YYYY-MM-DD" },
        until: { type: "string", description: "Custom end YYYY-MM-DD" },
        status: { type: "string", enum: ["succeeded", "requires_payment_method", "all"], default: "succeeded" },
        include_internal: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "meta_ads",
    description: "Meta Ads performance — spend, impressions, CPM, CTR, leads, CPL. Use date_preset OR (since + until) for custom ranges. Meta keeps insights for ~37 months.",
    inputSchema: {
      type: "object",
      properties: {
        date_preset: {
          type: "string",
          enum: [
            "today", "yesterday",
            "last_3d", "last_7d", "last_14d", "last_28d", "last_30d", "last_90d",
            "this_week_mon_today", "last_week_mon_sun",
            "this_month", "last_month",
            "this_quarter", "last_quarter",
            "this_year", "last_year",
            "maximum",
          ],
          default: "last_7d",
          description: "Quick preset. Use 'maximum' for the longest range Meta allows (~37 months).",
        },
        since: { type: "string", description: "Custom range start date YYYY-MM-DD (overrides date_preset)" },
        until: { type: "string", description: "Custom range end date YYYY-MM-DD (required with since)" },
        level: {
          type: "string",
          enum: ["campaign", "adset", "ad", "account"],
          default: "ad",
        },
        time_increment: {
          type: "string",
          enum: ["all", "1", "7", "monthly"],
          default: "all",
          description: "Time-series bucketing: 'all' (single total), '1' (daily), '7' (weekly), 'monthly'. Returns one row per bucket per entity.",
        },
      },
    },
  },
  {
    name: "report",
    description: "ONE-CALL master report: joins Meta spend/LPV + Stripe revenue + Supabase leads on the same time window. Returns weekly cohorts with: spend, LPV, sessions, leads, ventes, CPL, ROAS, conv lead→achat. Use this FIRST when answering questions like 'how did conversion evolve' or 'what's our ROAS by week'.",
    inputSchema: {
      type: "object",
      properties: {
        since: { type: "string", description: "Start date YYYY-MM-DD (e.g. '2026-04-01')" },
        until: { type: "string", description: "End date YYYY-MM-DD (defaults to today)" },
        breakdown: { type: "string", enum: ["day", "week", "month"], default: "week" },
      },
      required: ["since"],
    },
  },
  {
    name: "commits",
    description: "Recent Git commits on the production codebase — date, author, message, and files changed. Use this to find when a feature shipped or correlate funnel changes with code changes.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "integer", default: 14, minimum: 1, maximum: 90, description: "Number of days to look back" },
        with_files: { type: "boolean", default: false, description: "Include the list of changed files per commit" },
      },
    },
  },
  {
    name: "funnel_timeline",
    description: "Day-by-day timeline correlating Git commits with funnel KPIs (leads, sales, Meta spend). Use this to spot whether a code change moved the needle.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "integer", default: 14, minimum: 1, maximum: 60, description: "Number of days to look back" },
      },
    },
  },

  // ── Raw / escape hatch tools — full access to underlying APIs ─────────

  {
    name: "meta_raw",
    description: "Raw passthrough to the Meta Graph API v22.0. Use any endpoint path under the ad account (insights, ads, campaigns, adsets, adcreatives, adimages, customaudiences, etc.) with any fields and params. Returns the raw JSON. Example: path='/insights', fields='spend,impressions,actions,video_p100_watched_actions,conversions,reach,frequency,unique_clicks,cost_per_action_type'.",
    inputSchema: {
      type: "object",
      required: ["path"],
      properties: {
        path: { type: "string", description: "Path appended to the ad account (e.g. '/insights', '/ads', '/campaigns'). Or a full graph path starting with '/' to bypass account scoping." },
        fields: { type: "string", description: "Comma-separated list of fields to request." },
        params: { type: "object", description: "Extra query params (date_preset, time_range, level, breakdowns, limit, etc.)", additionalProperties: true },
      },
    },
  },
  {
    name: "stripe_raw",
    description: "Raw access to the Stripe API. Pass any resource name (charges, payment_intents, customers, refunds, disputes, payouts, balance_transactions, subscriptions, invoices, coupons, etc.) with arbitrary list params. Returns the raw Stripe response.",
    inputSchema: {
      type: "object",
      required: ["resource"],
      properties: {
        resource: { type: "string", description: "Stripe resource name (e.g. 'charges', 'payment_intents', 'refunds', 'customers')." },
        params: { type: "object", description: "Query params (limit, created[gte], created[lte], customer, status, etc.)", additionalProperties: true },
      },
    },
  },
  {
    name: "supabase_query",
    description: "Run a read-only query on any Supabase table. Supports select, filters (eq, gte, lte, like, in), order, limit. Tables available: leads, funnel_sessions, users, event_sessions, questionnaire_responses, visualization_previews, client_messages, etc.",
    inputSchema: {
      type: "object",
      required: ["table"],
      properties: {
        table: { type: "string", description: "Table name (e.g. 'leads', 'users', 'funnel_sessions', 'event_sessions')." },
        select: { type: "string", description: "Columns to select. Default '*'." },
        filters: { type: "object", description: "Object of column → value (eq) or { op: 'gte'|'lte'|'like'|'in', value: ... }", additionalProperties: true },
        order: { type: "string", description: "Column to order by (prefix with '-' for desc)" },
        limit: { type: "integer", default: 50, minimum: 1, maximum: 500 },
      },
    },
  },
  {
    name: "github_raw",
    description: "Raw access to the GitHub REST API for the production repo (Holox76000/protocol). Pass any path (commits, commits/SHA, contents/PATH, pulls, issues, etc.) and optional query params. Returns the raw JSON.",
    inputSchema: {
      type: "object",
      required: ["path"],
      properties: {
        path: { type: "string", description: "Path under /repos/Holox76000/protocol/ (e.g. 'commits', 'commits/abc123', 'contents/app/api/mcp/route.ts', 'pulls?state=closed')." },
      },
    },
  },
];

// ── GitHub helper ────────────────────────────────────────

const GH_REPO = "Holox76000/protocol";

async function ghCommits(days: number, withFiles: boolean) {
  const since = daysAgo(days);
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "protocol-club-mcp",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(`https://api.github.com/repos/${GH_REPO}/commits?since=${encodeURIComponent(since)}&per_page=100`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const list = await res.json() as Array<{
    sha: string;
    commit: { author: { name: string; date: string }; message: string };
    html_url: string;
  }>;

  const out = await Promise.all(list.map(async c => {
    const base = {
      sha: c.sha.slice(0, 7),
      date: c.commit.author.date,
      author: c.commit.author.name,
      message: c.commit.message.split("\n")[0],
      url: c.html_url,
      files: [] as string[],
    };
    if (withFiles) {
      const r = await fetch(`https://api.github.com/repos/${GH_REPO}/commits/${c.sha}`, { headers });
      if (r.ok) {
        const detail = await r.json() as { files?: Array<{ filename: string }> };
        base.files = (detail.files ?? []).map(f => f.filename);
      }
    }
    return base;
  }));

  return out;
}

// ── Tool implementations ──────────────────────────────────

async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  const supabase = getSupabase();

  if (name === "leads") {
    const { since, until, sinceDay, untilDay } = resolveWindow(args);
    const excludeInternal = args.exclude_internal !== false;

    const { data, error } = await supabase
      .from("leads")
      .select("email, payload, created_at")
      .gte("created_at", since)
      .lte("created_at", until)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    let rows = (data ?? []).map(r => {
      const p = (r.payload ?? {}) as Record<string, unknown>;
      const a = (p.answers ?? {}) as Record<string, unknown>;
      const u = (p.utm ?? {}) as Record<string, unknown>;
      return {
        date: fmtDate(r.created_at),
        name: String(a.first_name ?? "—"),
        email: r.email as string,
        utm_source:   String(u.utm_source ?? "—"),
        utm_campaign: String(u.utm_campaign ?? "—"),
        utm_content:  String(u.utm_content ?? "—"),
        morpho: String(a.morphology ?? "—"),
        age:    String(a.age_bracket ?? "—"),
        past:   Array.isArray(a.past_solutions) ? a.past_solutions.join(", ") : String(a.past_solutions ?? "—"),
        wants:  Array.isArray(a.expected_results) ? a.expected_results.slice(0, 2).join(", ") : String(a.expected_results ?? "—"),
      };
    });

    if (excludeInternal) rows = rows.filter(r => !isInternalEmail(r.email));
    if (args.utm_source)   rows = rows.filter(r => r.utm_source   === String(args.utm_source));
    if (args.utm_campaign) rows = rows.filter(r => r.utm_campaign === String(args.utm_campaign));
    if (args.utm_content)  rows = rows.filter(r => r.utm_content  === String(args.utm_content));

    if (!rows.length) return `No leads ${sinceDay} → ${untilDay}.`;

    return `${rows.length} leads · ${sinceDay} → ${untilDay}\n\n` + table(rows, [
      { key: "date",         label: "Date",     width: 10 },
      { key: "name",         label: "Name",     width: 12 },
      { key: "email",        label: "Email",    width: 28 },
      { key: "utm_source",   label: "Src",      width: 6  },
      { key: "utm_campaign", label: "Campaign", width: 20 },
      { key: "morpho",       label: "Body",     width: 11 },
      { key: "age",          label: "Age",      width: 7  },
      { key: "past",         label: "Tried",    width: 22 },
    ]);
  }

  if (name === "lead_detail") {
    const email = String(args.email ?? "");
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw new Error(error.message);
    if (!data?.length) return `No lead found for ${email}`;

    const r = data[0];
    const p = (r.payload ?? {}) as Record<string, unknown>;
    const a = (p.answers ?? {}) as Record<string, unknown>;
    const u = (p.utm ?? {}) as Record<string, unknown>;

    return [
      `Lead: ${email}`,
      `Created: ${fmtDate(r.created_at)}`,
      `Session ID: ${String(p.funnel_sid ?? "—")}`,
      ``,
      `── UTM Attribution ──────────────────`,
      `Source:   ${String(u.utm_source ?? "—")}`,
      `Campaign: ${String(u.utm_campaign ?? "—")}`,
      `Ad ID:    ${String(u.utm_content ?? "—")}`,
      `fbclid:   ${u.fbclid ? "present" : "absent"}`,
      ``,
      `── Quiz Answers ─────────────────────`,
      `Name:        ${String(a.first_name ?? "—")}`,
      `Age:         ${String(a.age_bracket ?? "—")}`,
      `Ethnicity:   ${String(a.ethnicity ?? "—")}`,
      `Body type:   ${String(a.morphology ?? "—")}`,
      `Pain since:  ${String(a.pain_timeline ?? "—")}`,
      `Height:      ${a.height_unit === "cm" ? `${a.height_cm}cm` : `${a.height_ft ?? "—"}'${a.height_in ?? "—"}"`}`,
      `Weight:      ${String(a.weight_value ?? "—")} ${String(a.weight_unit ?? "")}`,
      `Time/week:   ${String(a.weekly_time ?? "—")}`,
      `Environment: ${String(a.social_environment ?? "—")}`,
      `Tried:       ${Array.isArray(a.past_solutions) ? a.past_solutions.join(", ") : String(a.past_solutions ?? "—")}`,
      `Wants:       ${Array.isArray(a.expected_results) ? a.expected_results.join(", ") : String(a.expected_results ?? "—")}`,
    ].join("\n");
  }

  if (name === "funnel_stats") {
    const { since, until, sinceDay, untilDay } = resolveWindow(args);
    const breakdown = String(args.breakdown ?? "total") as "total" | "day" | "week";

    const { data: sessions, error } = await supabase
      .from("funnel_sessions")
      .select("session_id, answers, created_at")
      .gte("created_at", since)
      .lte("created_at", until);
    if (error) throw new Error(error.message);

    const { data: leadsData } = await supabase
      .from("leads")
      .select("email, payload, created_at")
      .gte("created_at", since)
      .lte("created_at", until);

    // Filter leads by UTM if requested
    let leads = (leadsData ?? []);
    if (args.utm_source) {
      leads = leads.filter(l => String(((l.payload as Record<string, unknown>)?.utm as Record<string, unknown>)?.utm_source ?? "") === String(args.utm_source));
    }
    // Match sessions to leads via funnel_sid (when UTM filter is applied)
    const leadSids = new Set(leads.map(l => String(((l.payload as Record<string, unknown>)?.funnel_sid ?? ""))).filter(Boolean));
    const filteredSessions = args.utm_source
      ? (sessions ?? []).filter(s => leadSids.has(s.session_id as string))
      : (sessions ?? []);

    const steps = [
      { key: "age_bracket",        label: "Q1  Âge" },
      { key: "morphology",         label: "Q3  Body type" },
      { key: "expected_results",   label: "Q6  Goals" },
      { key: "height_unit",        label: "Q7  Height" },
      { key: "weight_value",       label: "Q8  Weight" },
      { key: "weekly_time",        label: "Q9  Time/week" },
      { key: "social_environment", label: "Q10 Environment" },
      { key: "past_solutions",     label: "Q11 Past solutions" },
      { key: "email",              label: "OPTIN Email" },
    ];

    function funnelOf(rows: typeof filteredSessions, leadsCnt: number): string[] {
      const total = rows.length;
      if (!total) return ["  (no sessions)"];
      const out = [`  Sessions: ${total}  ·  Leads: ${leadsCnt}  ·  Lead rate: ${total ? Math.round(leadsCnt/total*100) : 0}%`];
      for (const s of steps) {
        const cnt = rows.filter(r => r.answers && typeof r.answers === "object" && (r.answers as Record<string, unknown>)[s.key]).length;
        out.push(`  ${String(total ? Math.round(cnt/total*100) : 0).padStart(3)}%  (${String(cnt).padStart(3)}/${total})  ${s.label}`);
      }
      return out;
    }

    if (breakdown === "total") {
      return [
        `Funnel · ${sinceDay} → ${untilDay}${args.utm_source ? ` · utm_source=${args.utm_source}` : ""}`,
        "",
        ...funnelOf(filteredSessions, leads.length),
      ].join("\n");
    }

    // Bucket by day or week
    const buckets: Record<string, { sessions: typeof filteredSessions; leads: number }> = {};
    for (const s of filteredSessions) {
      const b = bucketOf(s.created_at as string, breakdown === "day" ? "day" : "week");
      buckets[b] ??= { sessions: [], leads: 0 };
      buckets[b].sessions.push(s);
    }
    for (const l of leads) {
      const b = bucketOf(l.created_at as string, breakdown === "day" ? "day" : "week");
      buckets[b] ??= { sessions: [], leads: 0 };
      buckets[b].leads++;
    }

    const lines = [`Funnel · ${sinceDay} → ${untilDay} · by ${breakdown}${args.utm_source ? ` · utm_source=${args.utm_source}` : ""}`, ""];
    for (const day of Object.keys(buckets).sort()) {
      lines.push(`── ${day} ${"─".repeat(40)}`);
      lines.push(...funnelOf(buckets[day].sessions, buckets[day].leads));
      lines.push("");
    }
    return lines.join("\n");
  }

  if (name === "customers") {
    const limit = Number(args.limit ?? 20);
    const { data, error } = await supabase
      .from("users")
      .select("email, first_name, has_paid, created_at, questionnaire_submitted_at")
      .eq("has_paid", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    if (!data?.length) return "No paid customers found.";

    const rows = data.map(r => ({
      date:  fmtDate(r.created_at),
      name:  String(r.first_name ?? "—"),
      email: r.email,
      quest: r.questionnaire_submitted_at ? "submitted" : "pending",
    }));

    return `${data.length} customers\n\n` + table(rows, [
      { key: "date",  label: "Purchase date", width: 12 },
      { key: "name",  label: "Name",          width: 14 },
      { key: "email", label: "Email",         width: 30 },
      { key: "quest", label: "Questionnaire", width: 13 },
    ]);
  }

  if (name === "revenue") {
    const { sinceDay, untilDay } = resolveWindow(args);
    const sinceTs = Math.floor(new Date(`${sinceDay}T00:00:00Z`).getTime() / 1000);
    const untilTs = Math.floor(new Date(`${untilDay}T23:59:59Z`).getTime() / 1000);
    const stripe = getStripe();
    const breakdown = String(args.breakdown ?? "day") as "day" | "week" | "month";
    const excludeInternal = args.include_internal !== true;

    const intents = await fetchAllPaymentIntents(stripe, sinceTs, untilTs, "succeeded");
    const succeeded = intents
      .filter(p => p.amount_received > 100) // exclude $0.x test charges
      .filter(p => excludeInternal ? !isInternalEmail(p.receipt_email ?? (p.metadata as Record<string,string>)?.customer_email) : true);

    const total = succeeded.reduce((s, p) => s + p.amount_received, 0);
    const avg = succeeded.length ? Math.round(total / succeeded.length) : 0;

    const buckets: Record<string, number> = {};
    for (const p of succeeded) {
      const d = new Date(p.created * 1000).toISOString();
      const b = bucketOf(d, breakdown);
      buckets[b] = (buckets[b] ?? 0) + p.amount_received;
    }

    return [
      `Revenue · ${sinceDay} → ${untilDay} · succeeded only${excludeInternal ? " (internal excluded)" : ""}`,
      `Total: $${(total/100).toFixed(2)}  ·  Payments: ${succeeded.length}  ·  Avg ticket: $${(avg/100).toFixed(2)}`,
      ``,
      `── Per ${breakdown} ────────────────────`,
      ...Object.entries(buckets).sort().map(([b, amt]) => `${b}: $${(amt/100).toFixed(2)}`),
    ].join("\n");
  }

  if (name === "payments") {
    const { sinceDay, untilDay } = resolveWindow(args);
    const sinceTs = Math.floor(new Date(`${sinceDay}T00:00:00Z`).getTime() / 1000);
    const untilTs = Math.floor(new Date(`${untilDay}T23:59:59Z`).getTime() / 1000);
    const stripe = getStripe();
    const status = String(args.status ?? "succeeded");
    const excludeInternal = args.include_internal !== true;

    const intents = await fetchAllPaymentIntents(stripe, sinceTs, untilTs, status === "all" ? undefined : status);

    const rows = intents
      .filter(p => excludeInternal ? !isInternalEmail(p.receipt_email ?? (p.metadata as Record<string,string>)?.customer_email) : true)
      .map(p => {
        const m = (p.metadata ?? {}) as Record<string, string>;
        return {
          date:    new Date(p.created * 1000).toISOString().slice(0, 10),
          amount:  `$${((p.amount_received || p.amount) / 100).toFixed(2)}`,
          status:  p.status,
          email:   String(p.receipt_email ?? m.customer_email ?? "—"),
          src:     m.utm_source ?? "—",
          campaign: m.utm_campaign ?? "—",
          ad:      m.utm_content ?? "—",
        };
      });

    return `${rows.length} payments · ${sinceDay} → ${untilDay} · status=${status}\n\n` + table(rows, [
      { key: "date",     label: "Date",     width: 11 },
      { key: "amount",   label: "Amount",   width: 8  },
      { key: "status",   label: "Status",   width: 12 },
      { key: "email",    label: "Email",    width: 28 },
      { key: "src",      label: "Src",      width: 6  },
      { key: "campaign", label: "Campaign", width: 20 },
    ]);
  }

  if (name === "meta_ads") {
    if (!META_ACCOUNT) return "META_AD_ACCOUNT_ID not configured on the server.";
    const level = String(args.level ?? "ad");
    const ti    = String(args.time_increment ?? "all");
    const since = args.since ? String(args.since) : "";
    const until = args.until ? String(args.until) : "";

    const fields = "campaign_name,adset_name,ad_name,spend,impressions,clicks,cpm,ctr,actions,reach,frequency,unique_clicks,cost_per_action_type,date_start,date_stop";
    const ads = await fetchMetaInsights({
      level,
      fields,
      since: since || undefined,
      until: until || undefined,
      date_preset: since && until ? undefined : String(args.date_preset ?? "last_7d"),
      time_increment: ti,
    });
    if (!ads.length) return `No ad data for the requested window.`;

    const rangeLabel = since && until ? `${since} → ${until}` : String(args.date_preset ?? "last_7d");
    const lines = [`Meta Ads · ${rangeLabel} · by ${level} · time_increment=${ti}`, ""];
    let totSpend = 0, totLpv = 0, totLeads = 0, totClicks = 0, totImpr = 0;

    for (const ad of ads) {
      const actions = (ad.actions ?? []) as { action_type: string; value: string }[];
      const lpv     = Number(actions.find(a => a.action_type === "landing_page_view")?.value ?? 0);
      const leads   = Number(actions.find(a => a.action_type === "lead")?.value ?? 0);
      const purch   = Number(actions.find(a => a.action_type === "purchase" || a.action_type === "omni_purchase")?.value ?? 0);
      const spend   = parseFloat(String(ad.spend));
      const impr    = Number(ad.impressions ?? 0);
      const clicks  = Number(ad.clicks ?? 0);

      totSpend += spend; totLpv += lpv; totLeads += leads; totClicks += clicks; totImpr += impr;

      const cpl   = leads > 0 ? `$${(spend / leads).toFixed(2)}` : "—";
      const cpLpv = lpv > 0   ? `$${(spend / lpv).toFixed(2)}`   : "—";
      const label = String(ad.ad_name ?? ad.adset_name ?? ad.campaign_name ?? "account");
      const dateLabel = ad.date_start ? ` [${String(ad.date_start)}${ad.date_stop && ad.date_stop !== ad.date_start ? ` → ${String(ad.date_stop)}` : ""}]` : "";

      lines.push(
        `${label}${dateLabel}`,
        `  Spend $${spend.toFixed(2)}  ·  Impr ${impr}  ·  Clicks ${clicks}  ·  CTR ${parseFloat(String(ad.ctr ?? 0)).toFixed(2)}%`,
        `  LPV ${lpv} (${cpLpv})  ·  Leads ${leads} (${cpl})  ·  Purchases ${purch}`,
        ""
      );
    }

    const totCtr = totImpr > 0 ? (totClicks / totImpr * 100).toFixed(2) : "0";
    lines.push("─".repeat(60));
    lines.push(`TOTAL · Spend $${totSpend.toFixed(2)} · Impr ${totImpr} · CTR ${totCtr}%`);
    lines.push(`        LPV ${totLpv} (${totLpv>0?`$${(totSpend/totLpv).toFixed(2)}`:"—"}) · Leads ${totLeads} (${totLeads>0?`$${(totSpend/totLeads).toFixed(2)}`:"—"})`);

    return lines.join("\n");
  }

  // ── REPORT — one-call master answer for "how did X evolve" questions ──
  if (name === "report") {
    const { sinceDay, untilDay } = resolveWindow(args);
    const breakdown = String(args.breakdown ?? "week") as "day" | "week" | "month";

    const stripe = getStripe();
    const sinceTs = Math.floor(new Date(`${sinceDay}T00:00:00Z`).getTime() / 1000);
    const untilTs = Math.floor(new Date(`${untilDay}T23:59:59Z`).getTime() / 1000);

    const [metaRows, intents, leadsRes, sessionsRes] = await Promise.all([
      META_ACCOUNT ? fetchMetaInsights({
        level: "account",
        fields: "spend,impressions,clicks,actions,date_start",
        since: sinceDay,
        until: untilDay,
        time_increment: "1",
      }).catch(e => { console.error("meta failed", e); return []; }) : Promise.resolve([]),
      fetchAllPaymentIntents(stripe, sinceTs, untilTs, "succeeded").catch(() => []),
      supabase.from("leads").select("email, payload, created_at").gte("created_at", `${sinceDay}T00:00:00Z`).lte("created_at", `${untilDay}T23:59:59Z`),
      supabase.from("funnel_sessions").select("created_at").gte("created_at", `${sinceDay}T00:00:00Z`).lte("created_at", `${untilDay}T23:59:59Z`),
    ]);

    // Bucket everything
    type Bucket = { spend: number; lpv: number; impr: number; clicks: number; sessions: number; leads: number; revenue_cents: number; sales: number };
    const buckets: Record<string, Bucket> = {};
    const ensure = (d: string): Bucket => buckets[d] ??= { spend:0, lpv:0, impr:0, clicks:0, sessions:0, leads:0, revenue_cents:0, sales:0 };

    for (const m of metaRows) {
      const b = ensure(bucketOf(String(m.date_start), breakdown));
      const actions = (m.actions ?? []) as { action_type: string; value: string }[];
      b.spend  += parseFloat(String(m.spend ?? 0));
      b.lpv    += Number(actions.find(a => a.action_type === "landing_page_view")?.value ?? 0);
      b.impr   += Number(m.impressions ?? 0);
      b.clicks += Number(m.clicks ?? 0);
    }
    for (const s of sessionsRes.data ?? []) ensure(bucketOf(s.created_at as string, breakdown)).sessions++;
    for (const l of leadsRes.data ?? []) {
      if (isInternalEmail(l.email as string)) continue;
      ensure(bucketOf(l.created_at as string, breakdown)).leads++;
    }
    for (const p of intents) {
      if (isInternalEmail(p.receipt_email ?? (p.metadata as Record<string,string>)?.customer_email)) continue;
      if (p.amount_received < 100) continue; // skip $0.x tests
      const b = ensure(bucketOf(new Date(p.created*1000).toISOString(), breakdown));
      b.revenue_cents += p.amount_received;
      b.sales++;
    }

    const days = Object.keys(buckets).sort();
    if (!days.length) return `No data ${sinceDay} → ${untilDay}.`;

    // Totals
    const T: Bucket = { spend:0, lpv:0, impr:0, clicks:0, sessions:0, leads:0, revenue_cents:0, sales:0 };
    for (const b of Object.values(buckets)) {
      T.spend += b.spend; T.lpv += b.lpv; T.impr += b.impr; T.clicks += b.clicks;
      T.sessions += b.sessions; T.leads += b.leads; T.revenue_cents += b.revenue_cents; T.sales += b.sales;
    }

    const rows = days.map(d => {
      const b = buckets[d];
      const rev = b.revenue_cents/100;
      return {
        bucket:   d,
        spend:    `$${b.spend.toFixed(0)}`,
        lpv:      String(b.lpv),
        sessions: String(b.sessions),
        leads:    String(b.leads),
        sales:    String(b.sales),
        revenue:  `$${rev.toFixed(0)}`,
        cpl:      b.leads ? `$${(b.spend/b.leads).toFixed(2)}` : "—",
        roas:     b.spend>0 ? (rev/b.spend).toFixed(2) : "—",
        conv:     b.leads ? `${(b.sales/b.leads*100).toFixed(1)}%` : "—",
      };
    });

    const tableStr = table(rows, [
      { key: "bucket",   label: "Period",     width: 12 },
      { key: "spend",    label: "Spend",      width: 8  },
      { key: "lpv",      label: "LPV",        width: 5  },
      { key: "sessions", label: "Sessions",   width: 9  },
      { key: "leads",    label: "Leads",      width: 6  },
      { key: "sales",    label: "Sales",      width: 6  },
      { key: "revenue",  label: "Revenue",    width: 9  },
      { key: "cpl",      label: "CPL",        width: 7  },
      { key: "roas",     label: "ROAS",       width: 6  },
      { key: "conv",     label: "L→Sale",     width: 7  },
    ]);

    const totalRev = T.revenue_cents/100;
    return [
      `Master report · ${sinceDay} → ${untilDay} · by ${breakdown}`,
      `Excludes internal test emails and <$1 charges. Revenue = succeeded Stripe payments. ROAS = revenue ÷ Meta spend.`,
      ``,
      tableStr,
      ``,
      `── TOTAL ─────────────────────────────`,
      `Spend $${T.spend.toFixed(2)} · LPV ${T.lpv} · Sessions ${T.sessions} · Leads ${T.leads} · Sales ${T.sales} · Revenue $${totalRev.toFixed(2)}`,
      `Global ROAS: ${T.spend > 0 ? (totalRev/T.spend).toFixed(2) : "—"}  ·  CPL: ${T.leads > 0 ? `$${(T.spend/T.leads).toFixed(2)}` : "—"}  ·  Lead→Sale: ${T.leads > 0 ? `${(T.sales/T.leads*100).toFixed(1)}%` : "—"}`,
    ].join("\n");
  }

  if (name === "commits") {
    const days = Number(args.days ?? 14);
    const withFiles = Boolean(args.with_files ?? false);
    const commits = await ghCommits(days, withFiles);
    if (!commits.length) return `No commits in the last ${days} days.`;

    const lines = [`${commits.length} commits — last ${days} days`, ""];
    for (const c of commits) {
      lines.push(`${c.date.slice(0, 10)} ${c.date.slice(11, 16)}  ${c.sha}  ${c.author}`);
      lines.push(`  ${c.message}`);
      if (withFiles && c.files.length) {
        lines.push(`  Files (${c.files.length}): ${c.files.slice(0, 8).join(", ")}${c.files.length > 8 ? "…" : ""}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  if (name === "funnel_timeline") {
    const days = Number(args.days ?? 14);
    const since = daysAgo(days);

    const [commits, leadsRes, usersRes, metaRes] = await Promise.all([
      ghCommits(days, false).catch(() => []),
      supabase.from("leads").select("created_at").gte("created_at", since),
      supabase.from("users").select("created_at,has_paid").eq("has_paid", true).gte("created_at", since),
      META_ACCOUNT
        ? fetch(`https://graph.facebook.com/v22.0/${META_ACCOUNT}/insights?fields=spend,actions&level=account&time_increment=1&time_range=${encodeURIComponent(JSON.stringify({since: since.slice(0,10), until: new Date().toISOString().slice(0,10)}))}&access_token=${META_TOKEN}`).then(r => r.json()).catch(() => ({}))
        : Promise.resolve({}),
    ]);

    // Build per-day buckets
    const byDay: Record<string, { commits: string[]; leads: number; sales: number; spend: number; lpv: number }> = {};
    const ensure = (d: string) => byDay[d] ??= { commits: [], leads: 0, sales: 0, spend: 0, lpv: 0 };

    for (const c of commits) ensure(c.date.slice(0, 10)).commits.push(`${c.sha} ${c.message.slice(0, 65)}`);
    for (const l of leadsRes.data ?? []) ensure((l.created_at as string).slice(0, 10)).leads++;
    for (const u of usersRes.data ?? []) ensure((u.created_at as string).slice(0, 10)).sales++;

    const metaData = ((metaRes as { data?: Array<{ date_start: string; spend: string; actions?: Array<{ action_type: string; value: string }> }> }).data ?? []);
    for (const d of metaData) {
      const b = ensure(d.date_start);
      b.spend = parseFloat(d.spend);
      b.lpv = Number((d.actions ?? []).find(a => a.action_type === "landing_page_view")?.value ?? 0);
    }

    const sortedDays = Object.keys(byDay).sort();
    if (!sortedDays.length) return `No activity in the last ${days} days.`;

    const lines = [`Funnel timeline — last ${days} days`, ""];
    for (const day of sortedDays) {
      const b = byDay[day];
      lines.push(`── ${day} ${"─".repeat(40)}`);
      const kpis: string[] = [];
      if (b.spend > 0)    kpis.push(`Spend $${b.spend.toFixed(2)}`);
      if (b.lpv > 0)      kpis.push(`LPV ${b.lpv}`);
      if (b.leads > 0)    kpis.push(`Leads ${b.leads}`);
      if (b.sales > 0)    kpis.push(`💰 Sales ${b.sales}`);
      if (kpis.length)    lines.push(`  ${kpis.join(" · ")}`);
      else                lines.push(`  (no funnel activity)`);
      for (const c of b.commits) lines.push(`  → ${c}`);
      lines.push("");
    }
    return lines.join("\n");
  }

  // ── RAW / ESCAPE HATCH TOOLS ──────────────────────────────

  if (name === "meta_raw") {
    if (!META_ACCOUNT) return "META_AD_ACCOUNT_ID not configured.";
    const path   = String(args.path ?? "");
    const fields = String(args.fields ?? "");
    const params = (args.params ?? {}) as Record<string, unknown>;

    const fullPath = path.startsWith("/")
      ? path.slice(1)  // absolute path, no account prefix
      : `${META_ACCOUNT}${path.startsWith("/") ? "" : "/"}${path}`;

    const qs = new URLSearchParams({ access_token: META_TOKEN });
    if (fields) qs.set("fields", fields);
    for (const [k, v] of Object.entries(params)) {
      if (v == null) continue;
      qs.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }

    const url = `https://graph.facebook.com/v22.0/${fullPath}?${qs.toString()}`;
    const res = await fetch(url);
    const json = await res.json();
    return JSON.stringify(json, null, 2);
  }

  if (name === "stripe_raw") {
    const stripe = getStripe();
    const resource = String(args.resource ?? "");
    const params = (args.params ?? {}) as Record<string, unknown>;

    // Use stripe.request to hit any list endpoint dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = stripe as any;
    if (!client[resource] || typeof client[resource].list !== "function") {
      return `Unknown Stripe resource: ${resource}. Try: charges, payment_intents, customers, refunds, disputes, payouts, balance_transactions, subscriptions, invoices, coupons, products, prices.`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await client[resource].list(params);
    return JSON.stringify(result, null, 2);
  }

  if (name === "supabase_query") {
    const table   = String(args.table ?? "");
    const select  = String(args.select ?? "*");
    const filters = (args.filters ?? {}) as Record<string, unknown>;
    const order   = args.order ? String(args.order) : null;
    const limit   = Number(args.limit ?? 50);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from(table).select(select);

    for (const [col, raw] of Object.entries(filters)) {
      if (raw && typeof raw === "object" && "op" in raw && "value" in raw) {
        const f = raw as { op: string; value: unknown };
        const v = f.value;
        if (f.op === "eq")   q = q.eq(col, v);
        else if (f.op === "gte")  q = q.gte(col, v);
        else if (f.op === "lte")  q = q.lte(col, v);
        else if (f.op === "gt")   q = q.gt(col, v);
        else if (f.op === "lt")   q = q.lt(col, v);
        else if (f.op === "like") q = q.like(col, String(v));
        else if (f.op === "ilike") q = q.ilike(col, String(v));
        else if (f.op === "in")   q = q.in(col, Array.isArray(v) ? v : [v]);
        else if (f.op === "is")   q = q.is(col, v as null | boolean);
        else if (f.op === "not")  q = q.not(col, "eq", v);
      } else {
        q = q.eq(col, raw);
      }
    }

    if (order) {
      const desc = order.startsWith("-");
      q = q.order(desc ? order.slice(1) : order, { ascending: !desc });
    }
    q = q.limit(limit);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return JSON.stringify(data, null, 2);
  }

  if (name === "github_raw") {
    const path = String(args.path ?? "");
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github+json",
      "User-Agent": "protocol-club-mcp",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const url = `https://api.github.com/repos/${GH_REPO}/${path.replace(/^\//, "")}`;
    const res = await fetch(url, { headers });
    const text = await res.text();
    try { return JSON.stringify(JSON.parse(text), null, 2); }
    catch { return text; }
  }

  throw new Error(`Unknown tool: ${name}`);
}

// ── MCP JSON-RPC handler ─────────────────────────────────

type JsonRpcRequest = {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
  id?: number | string | null;
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, MCP-Protocol-Version, Accept",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

function withCors(res: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

function ok(id: unknown, result: unknown) {
  return withCors(NextResponse.json({ jsonrpc: "2.0", id, result }));
}

function err(id: unknown, code: number, message: string) {
  return withCors(NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: 200 }));
}

// ── Route handlers ────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  // Auth — accepts both OAuth token and static Bearer secret
  const auth  = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = process.env.MCP_SECRET ?? "";
  const isValid = token === secret || verifyToken(token);
  if (!isValid) {
    return withCors(NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "WWW-Authenticate": `Bearer error="invalid_token", resource_metadata="https://protocol-club.com/.well-known/oauth-protected-resource/api/mcp"` } }
    ));
  }

  const body = (await request.json()) as JsonRpcRequest;
  const { method, params, id } = body;

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2024-11-05",
      serverInfo: { name: "protocol-data", version: "1.0.0" },
      capabilities: { tools: {} },
    });
  }

  if (method === "notifications/initialized") {
    return withCors(new NextResponse(null, { status: 204 }));
  }

  if (method === "ping") {
    return ok(id, {});
  }

  if (method === "tools/list") {
    return ok(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const toolName = String((params as Record<string, unknown>)?.name ?? "");
    const toolArgs = ((params as Record<string, unknown>)?.arguments ?? {}) as Record<string, unknown>;
    try {
      const text = await runTool(toolName, toolArgs);
      return ok(id, { content: [{ type: "text", text }] });
    } catch (e) {
      return err(id, -32603, String(e));
    }
  }

  return err(id, -32601, `Method not found: ${method}`);
}

// Some MCP clients probe GET — return same WWW-Authenticate so they can discover OAuth
export async function GET(request: NextRequest) {
  const auth  = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = process.env.MCP_SECRET ?? "";
  const isValid = token === secret || verifyToken(token);
  if (!isValid) {
    return withCors(new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": `Bearer error="invalid_token", resource_metadata="https://protocol-club.com/.well-known/oauth-protected-resource/api/mcp"` },
    }));
  }
  return withCors(new NextResponse("This MCP server uses POST for JSON-RPC.", { status: 405 }));
}
