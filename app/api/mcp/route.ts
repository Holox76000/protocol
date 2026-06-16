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
    description: "Quiz leads collected over the last N days — name, email, UTM source, body type, past solutions, desired results.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "integer", default: 7, minimum: 1, maximum: 90, description: "Number of days to look back" },
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
    description: "Funnel session stats — sessions per day, step completion rates, lead conversion rate.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "integer", default: 7, minimum: 1, maximum: 90, description: "Number of days to look back" },
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
    description: "Stripe revenue summary — total, number of payments, average ticket, breakdown per day.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "integer", default: 30, minimum: 1, maximum: 365, description: "Number of days to look back" },
      },
    },
  },
  {
    name: "payments",
    description: "Recent Stripe payments — amount, email, date, status.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", default: 10, minimum: 1, maximum: 50 },
      },
    },
  },
  {
    name: "meta_ads",
    description: "Meta Ads performance — spend, impressions, CPM, CTR, leads and CPL per ad/campaign.",
    inputSchema: {
      type: "object",
      properties: {
        date_preset: {
          type: "string",
          enum: ["today", "yesterday", "last_7d", "last_14d", "last_30d", "this_month", "last_month"],
          default: "last_7d",
        },
        level: {
          type: "string",
          enum: ["campaign", "adset", "ad"],
          default: "ad",
        },
      },
    },
  },
];

// ── Tool implementations ──────────────────────────────────

async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  const supabase = getSupabase();

  if (name === "leads") {
    const days = Number(args.days ?? 7);
    const { data, error } = await supabase
      .from("leads")
      .select("email, payload, created_at")
      .gte("created_at", daysAgo(days))
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    if (!data?.length) return `No leads in the last ${days} days.`;

    const rows = data.map(r => {
      const p = (r.payload ?? {}) as Record<string, unknown>;
      const a = (p.answers ?? {}) as Record<string, unknown>;
      const u = (p.utm ?? {}) as Record<string, unknown>;
      const past = Array.isArray(a.past_solutions) ? a.past_solutions.join(", ") : String(a.past_solutions ?? "—");
      const wants = Array.isArray(a.expected_results) ? a.expected_results.slice(0, 2).join(", ") : String(a.expected_results ?? "—");
      return { date: fmtDate(r.created_at), name: String(a.first_name ?? "—"), email: r.email, src: String(u.utm_source ?? "—"), morpho: String(a.morphology ?? "—"), age: String(a.age_bracket ?? "—"), past, wants };
    });

    return `${data.length} leads — last ${days} days\n\n` + table(rows, [
      { key: "date",  label: "Date",     width: 10 },
      { key: "name",  label: "Name",     width: 12 },
      { key: "email", label: "Email",    width: 28 },
      { key: "src",   label: "Src",      width: 6  },
      { key: "morpho",label: "Body",     width: 11 },
      { key: "age",   label: "Age",      width: 7  },
      { key: "past",  label: "Tried",    width: 22 },
      { key: "wants", label: "Wants",    width: 30 },
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
    const days = Number(args.days ?? 7);
    const { data, error } = await supabase
      .from("funnel_sessions")
      .select("answers, created_at")
      .gte("created_at", daysAgo(days))
      .limit(1000);

    if (error) throw new Error(error.message);
    const total = data?.length ?? 0;
    if (!total) return `No funnel sessions in the last ${days} days.`;

    const byDay: Record<string, number> = {};
    for (const r of data!) {
      const d = fmtDate(r.created_at);
      byDay[d] = (byDay[d] ?? 0) + 1;
    }

    const steps = [
      { key: "age_bracket",       label: "Q1  Âge" },
      { key: "morphology",        label: "Q3  Body type" },
      { key: "expected_results",  label: "Q6  What to change" },
      { key: "height_unit",       label: "Q7  Height" },
      { key: "weight_value",      label: "Q8  Weight" },
      { key: "weekly_time",       label: "Q9  Time/week" },
      { key: "social_environment",label: "Q10 Environment" },
      { key: "past_solutions",    label: "Q11 Past solutions" },
      { key: "email",             label: "OPTIN Email" },
    ];

    const { data: leads } = await supabase.from("leads").select("created_at").gte("created_at", daysAgo(days));
    const leadCount = leads?.length ?? 0;

    return [
      `Funnel — last ${days} days`,
      `Sessions: ${total}  |  Leads: ${leadCount}  |  Lead rate: ${Math.round(leadCount / total * 100)}%`,
      ``,
      `── Sessions per day ─────────────────`,
      ...Object.entries(byDay).sort().map(([d, n]) => `${d}: ${n}`),
      ``,
      `── Step completion ──────────────────`,
      ...steps.map(s => {
        const cnt = data!.filter(r => r.answers && typeof r.answers === "object" && (r.answers as Record<string, unknown>)[s.key]).length;
        return `${String(Math.round(cnt / total * 100)).padStart(3)}%  (${String(cnt).padStart(3)}/${total})  ${s.label}`;
      }),
    ].join("\n");
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
    const days = Number(args.days ?? 30);
    const stripe = getStripe();
    const since = Math.floor(Date.now() / 1000) - days * 86400;
    const charges = await stripe.paymentIntents.list({ created: { gte: since }, limit: 100 });
    const succeeded = charges.data.filter(p => p.status === "succeeded");
    const total = succeeded.reduce((s, p) => s + p.amount_received, 0);
    const avg = succeeded.length ? Math.round(total / succeeded.length) : 0;

    const byDay: Record<string, number> = {};
    for (const p of succeeded) {
      const d = new Date(p.created * 1000).toISOString().slice(0, 10);
      byDay[d] = (byDay[d] ?? 0) + p.amount_received;
    }

    return [
      `Revenue — last ${days} days`,
      `Total: $${(total / 100).toFixed(2)}  |  Payments: ${succeeded.length}  |  Avg: $${(avg / 100).toFixed(2)}`,
      ``,
      `── Per day ──────────────────────────`,
      ...Object.entries(byDay).sort().map(([d, amt]) => `${d}: $${(amt / 100).toFixed(2)}`),
    ].join("\n");
  }

  if (name === "payments") {
    const limit = Number(args.limit ?? 10);
    const stripe = getStripe();
    const intents = await stripe.paymentIntents.list({ limit });
    const rows = intents.data.map(p => ({
      date:   new Date(p.created * 1000).toISOString().slice(0, 10),
      amount: `$${(p.amount_received / 100).toFixed(2)}`,
      status: p.status,
      email:  String(p.receipt_email ?? (p.metadata as Record<string, string>)?.email ?? "—"),
    }));
    return table(rows, [
      { key: "date",   label: "Date",   width: 12 },
      { key: "amount", label: "Amount", width: 8  },
      { key: "status", label: "Status", width: 12 },
      { key: "email",  label: "Email",  width: 30 },
    ]);
  }

  if (name === "meta_ads") {
    if (!META_ACCOUNT) return "META_AD_ACCOUNT_ID not configured on the server.";
    const date_preset = String(args.date_preset ?? "last_7d");
    const level = String(args.level ?? "ad");

    const fields = "campaign_name,adset_name,ad_name,spend,impressions,clicks,cpm,ctr,actions";
    const url = `https://graph.facebook.com/v22.0/${META_ACCOUNT}/insights?fields=${fields}&level=${level}&date_preset=${date_preset}&limit=50&access_token=${META_TOKEN}`;
    const res = await fetch(url);
    const json = await res.json() as { data?: Record<string, unknown>[]; error?: { message: string } };

    if (json.error) throw new Error(json.error.message);
    const ads = json.data ?? [];
    if (!ads.length) return "No ad data for this period.";

    const lines = [`Meta Ads — ${date_preset} — by ${level}`, ""];
    for (const ad of ads) {
      const actions = (ad.actions ?? []) as { action_type: string; value: string }[];
      const leads = Number(actions.find(a => a.action_type === "lead")?.value ?? 0);
      const cpl = leads > 0 ? `$${(parseFloat(String(ad.spend)) / leads).toFixed(2)}` : "—";
      const label = String(ad.ad_name ?? ad.adset_name ?? ad.campaign_name ?? "?");
      lines.push(
        label,
        `  Spend: $${parseFloat(String(ad.spend)).toFixed(2)}  |  Impr: ${ad.impressions}  |  CTR: ${parseFloat(String(ad.ctr ?? 0)).toFixed(2)}%  |  Leads: ${leads}  |  CPL: ${cpl}`,
        ""
      );
    }
    return lines.join("\n");
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
      { status: 401, headers: { "WWW-Authenticate": `Bearer resource_metadata="https://protocol-club.com/.well-known/oauth-protected-resource"` } }
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
      headers: { "WWW-Authenticate": `Bearer resource_metadata="https://protocol-club.com/.well-known/oauth-protected-resource"` },
    }));
  }
  return withCors(new NextResponse("This MCP server uses POST for JSON-RPC.", { status: 405 }));
}
