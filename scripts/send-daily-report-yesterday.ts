import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const META_TOKEN = process.env.META_ADS_READ_TOKEN || process.env.META_ACCESS_TOKEN!;
const META_ACCOUNT = process.env.META_AD_ACCOUNT_ID!;
const SLACK_WEBHOOK_REPORT = process.env.SLACK_WEBHOOK_REPORT!;
const BREAKEVEN_ROAS = 1.2;

const INTERNAL_EMAIL_RE = /(patrypierreandre|sofiane\.lekfif|thibault\.cdn|reddotgrowth)/i;
const isInternal = (email: string | null | undefined) =>
  !!email && INTERNAL_EMAIL_RE.test(email);

// Same helper as lib/parisTz — yesterday in Europe/Paris timezone
function yesterdayParisDate(): string {
  const now = new Date();
  const parisNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  parisNow.setDate(parisNow.getDate() - 1);
  const y = parisNow.getFullYear();
  const m = String(parisNow.getMonth() + 1).padStart(2, "0");
  const d = String(parisNow.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function parisMidnightUtc(dateStr: string): number {
  // Interpret dateStr as midnight in Europe/Paris and return UTC ms.
  // Simplified: Paris = UTC+1 (winter) or UTC+2 (summer). Use Intl to be safe.
  const [y, m, d] = dateStr.split("-").map(Number);
  // Find the offset at that date
  const probe = new Date(Date.UTC(y, m - 1, d, 12));
  const parisStr = probe.toLocaleString("sv-SE", { timeZone: "Europe/Paris" });
  const utcStr = probe.toISOString().replace("T", " ").slice(0, 19);
  const diffMs = new Date(parisStr).getTime() - new Date(utcStr).getTime();
  return Date.UTC(y, m - 1, d, 0, 0, 0) - diffMs;
}

async function main() {
  const yesterday = yesterdayParisDate();
  const sinceMs = parisMidnightUtc(yesterday);
  const untilMs = parisMidnightUtc(yesterday) + 24 * 3600 * 1000;
  const sinceSec = Math.floor(sinceMs / 1000);
  const untilSec = Math.floor(untilMs / 1000);

  console.log(`Running report for Paris day ${yesterday} (${new Date(sinceMs).toISOString()} → ${new Date(untilMs).toISOString()})`);

  // ── Meta spend + LPV ─────────────────────────────
  let metaSpend = 0, metaLpv = 0, metaError: string | null = null;
  try {
    const params = new URLSearchParams({
      fields: "spend,actions",
      level: "account",
      time_range: JSON.stringify({ since: yesterday, until: yesterday }),
      access_token: META_TOKEN,
    });
    const body = await fetch(`https://graph.facebook.com/v22.0/${META_ACCOUNT}/insights?${params}`).then(r => r.json());
    if (body.error) metaError = body.error.message ?? "unknown Meta error";
    else if (body.data?.length) {
      metaSpend = parseFloat(body.data[0].spend ?? "0") || 0;
      const lpv = (body.data[0].actions ?? []).find((a: { action_type: string }) => a.action_type === "landing_page_view");
      metaLpv = lpv ? parseInt(lpv.value, 10) || 0 : 0;
    }
  } catch (e) { metaError = String(e); }

  // ── Opt-ins ──────────────────────────────────────
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  let optinCount = 0, optinError: string | null = null;
  try {
    const { data, error } = await sb
      .from("funnel_sessions")
      .select("answers")
      .gte("created_at", new Date(sinceMs).toISOString())
      .lte("created_at", new Date(untilMs).toISOString());
    if (error) throw error;
    optinCount = (data ?? []).filter(s => {
      const email = ((s.answers as Record<string, unknown>)?.email ?? "") as string;
      return email && !isInternal(email);
    }).length;
  } catch (e) { optinError = String(e); }

  // ── Stripe ───────────────────────────────────────
  let stripeSales = 0, stripeSalesCount = 0, stripeCartInitiated = 0, stripeError: string | null = null;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as Stripe.LatestApiVersion });
    const pis: Stripe.PaymentIntent[] = [];
    let starting_after: string | undefined;
    while (true) {
      const page: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list({
        created: { gte: sinceSec, lte: untilSec },
        limit: 100,
        starting_after,
      });
      pis.push(...page.data);
      if (!page.has_more) break;
      starting_after = page.data[page.data.length - 1].id;
    }
    const cartExternal = pis.filter(pi =>
      (pi.amount ?? 0) >= 100 &&
      !isInternal((pi as Stripe.PaymentIntent & { receipt_email?: string | null }).receipt_email)
    );
    stripeCartInitiated = cartExternal.length;
    const paid = cartExternal.filter(pi => pi.status === "succeeded");
    stripeSales = paid.reduce((sum, pi) => sum + (pi.amount ?? 0) / 100, 0);
    stripeSalesCount = paid.length;
  } catch (e) { stripeError = String(e); }

  // ── Compute ──────────────────────────────────────
  const roas = metaSpend > 0 ? stripeSales / metaSpend : 0;
  const netProfit = stripeSales - BREAKEVEN_ROAS * metaSpend;
  const isProfit = netProfit >= 0;
  const lpvToOptinPct = metaLpv > 0 ? (100 * optinCount) / metaLpv : 0;
  const costPerOptin = optinCount > 0 ? metaSpend / optinCount : 0;
  const costPerCart = stripeCartInitiated > 0 ? metaSpend / stripeCartInitiated : 0;
  const costPerPurchase = stripeSalesCount > 0 ? metaSpend / stripeSalesCount : 0;
  const optinToCartPct = optinCount > 0 ? (100 * stripeCartInitiated) / optinCount : 0;
  const cartToPaidPct = stripeCartInitiated > 0 ? (100 * stripeSalesCount) / stripeCartInitiated : 0;
  const optinToPaidPct = optinCount > 0 ? (100 * stripeSalesCount) / optinCount : 0;

  const dateLabel = new Date(sinceMs).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "Europe/Paris" });
  const fmtUsd = (n: number) => n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
  const fmtUsdAbs = (n: number) => `$${n.toFixed(2)}`;
  const headerWord = isProfit ? "Profit" : "Loss";
  const headerLine = `${isProfit ? ":rocket:" : ":rotating_light:"} *Daily Report — ${dateLabel}*`;

  let toneLine: string;
  if (isProfit && roas >= 2.0) toneLine = `:fire: *Crushing it. ROAS ${roas.toFixed(2)}, net ${fmtUsd(netProfit)}.*`;
  else if (isProfit && roas >= 1.5) toneLine = `:dollar: *Profitable day. Net ${fmtUsd(netProfit)}.*`;
  else if (isProfit) toneLine = `:white_check_mark: *Above breakeven. Net ${fmtUsd(netProfit)}.*`;
  else if (roas >= 1.0) toneLine = `:warning: *Above 1× ROAS but below breakeven. Net ${fmtUsd(netProfit)}.*`;
  else toneLine = `:rotating_light: *Below 1× ROAS. Net ${fmtUsd(netProfit)}.*`;

  const errLines: string[] = [];
  if (metaError)   errLines.push(`:warning: Meta API error: \`${metaError.slice(0, 200)}\``);
  if (stripeError) errLines.push(`:warning: Stripe error: \`${stripeError.slice(0, 200)}\``);
  if (optinError)  errLines.push(`:warning: Opt-in query error: \`${optinError.slice(0, 200)}\``);

  const attachment = {
    color: isProfit ? "#2eb886" : "#e01e5a",
    blocks: [
      { type: "header", text: { type: "plain_text", text: `${isProfit ? "💰" : "🔻"} Daily Report — ${dateLabel} (replay)` } },
      { type: "section", text: { type: "mrkdwn", text: toneLine } },
      { type: "section", fields: [
        { type: "mrkdwn", text: `*Spend Meta*\n${fmtUsdAbs(metaSpend)}` },
        { type: "mrkdwn", text: `*Sales Stripe*\n${fmtUsdAbs(stripeSales)} _(${stripeSalesCount} ${stripeSalesCount === 1 ? "vente" : "ventes"})_` },
        { type: "mrkdwn", text: `*ROAS*\n${roas.toFixed(2)}× _(breakeven ${BREAKEVEN_ROAS}×)_` },
        { type: "mrkdwn", text: `*Net P&L*\n${fmtUsd(netProfit)}` },
      ]},
      { type: "divider" },
      { type: "section", text: { type: "mrkdwn", text: ":snowflake: *Cold traffic funnel*" } },
      { type: "section", fields: [
        { type: "mrkdwn", text: `*LP Views (Meta)*\n${metaLpv}` },
        { type: "mrkdwn", text: `*Opt-ins*\n${optinCount}` },
        { type: "mrkdwn", text: `*LPV → Opt-in*\n${lpvToOptinPct.toFixed(1)}%` },
        { type: "mrkdwn", text: `*Cost per Opt-in*\n${costPerOptin > 0 ? fmtUsdAbs(costPerOptin) : "—"}` },
        { type: "mrkdwn", text: `*Cart initiated*\n${stripeCartInitiated}` },
        { type: "mrkdwn", text: `*Cost per Cart*\n${costPerCart > 0 ? fmtUsdAbs(costPerCart) : "—"}` },
        { type: "mrkdwn", text: `*Opt-in → Cart*\n${optinToCartPct.toFixed(1)}% _(${stripeCartInitiated}/${optinCount})_` },
        { type: "mrkdwn", text: `*Cart → Paid*\n${cartToPaidPct.toFixed(1)}% _(${stripeSalesCount}/${stripeCartInitiated})_` },
        { type: "mrkdwn", text: `*Cost per Purchase*\n${costPerPurchase > 0 ? fmtUsdAbs(costPerPurchase) : "—"}` },
        { type: "mrkdwn", text: `*Opt-in → Paid*\n${optinToPaidPct.toFixed(1)}% _(${stripeSalesCount}/${optinCount})_` },
      ]},
      ...(errLines.length ? [{ type: "section", text: { type: "mrkdwn", text: errLines.join("\n") } }] : []),
      { type: "context", elements: [{ type: "mrkdwn", text: `_Period: Europe/Paris day ${yesterday} (Meta ad account timezone) · ${headerWord} = sales − 1.2 × spend · manual replay_` }] },
    ],
  };

  console.log("\nReport values:");
  console.log({ metaSpend, metaLpv, stripeSales, stripeSalesCount, stripeCartInitiated, optinCount, roas, netProfit });

  const res = await fetch(SLACK_WEBHOOK_REPORT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `<!channel> ${headerLine} — Spend ${fmtUsdAbs(metaSpend)} · Sales ${fmtUsdAbs(stripeSales)} · ROAS ${roas.toFixed(2)}× · Net ${fmtUsd(netProfit)}`,
      attachments: [attachment],
    }),
  });
  console.log(`\nSlack response: ${res.status} ${res.statusText}`);
  if (!res.ok) console.log(await res.text());
}
main().catch(e => { console.error(e); process.exit(1); });
