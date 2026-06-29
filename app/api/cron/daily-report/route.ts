import { NextResponse } from "next/server";
import Stripe from "stripe";
import { postToSlack } from "../../../../lib/slack";

export const runtime = "nodejs";
export const maxDuration = 60;

const META_TOKEN = process.env.META_ADS_READ_TOKEN || process.env.META_ACCESS_TOKEN!;
const META_ACCOUNT = process.env.META_AD_ACCOUNT_ID!;

// Breakeven ROAS — sales must be >= 1.2× ad spend to cover everything else
// (Stripe fees, delivery costs, infra, etc.). Net profit = sales − 1.2 × spend.
const BREAKEVEN_ROAS = 1.2;

// Internal/test emails to exclude from sales totals.
const INTERNAL = ["patrypierreandre", "sofiane.lekfif", "sofiane@reddotgrowth", "thibault.cdn", "reddotgrowth"];
const isInternal = (email: string | null | undefined): boolean =>
  !!email && INTERNAL.some(p => email.toLowerCase().includes(p));

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The cron runs at 20:00 UTC (= 00:00 Dubai, UTC+4). We report on the last
  // 24h ending now — that's the full Dubai day that just closed.
  const untilMs = Date.now();
  const sinceMs = untilMs - 24 * 3600 * 1000;
  const untilSec = Math.floor(untilMs / 1000);
  const sinceSec = Math.floor(sinceMs / 1000);

  // ── Meta spend ────────────────────────────────────────────
  let metaSpend = 0;
  let metaError: string | null = null;
  try {
    const sinceDay = new Date(sinceMs).toISOString().slice(0, 10);
    const untilDay = new Date(untilMs).toISOString().slice(0, 10);
    const params = new URLSearchParams({
      fields: "spend",
      level: "account",
      time_range: JSON.stringify({ since: sinceDay, until: untilDay }),
      access_token: META_TOKEN,
    });
    const res = await fetch(`https://graph.facebook.com/v22.0/${META_ACCOUNT}/insights?${params.toString()}`);
    const body: { data?: { spend?: string }[]; error?: { message?: string } } = await res.json();
    if (body.error) metaError = body.error.message ?? "unknown Meta API error";
    else if (body.data && body.data.length > 0) {
      metaSpend = parseFloat(body.data[0].spend ?? "0") || 0;
    }
  } catch (err) {
    metaError = String(err);
  }

  // ── Stripe sales (sum of succeeded $89+ PIs, external customers only) ──
  let stripeSales = 0;
  let stripeSalesCount = 0;
  let stripeError: string | null = null;
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
    const paid = pis.filter(pi =>
      pi.status === "succeeded" &&
      (pi.amount ?? 0) >= 100 &&
      !isInternal((pi as Stripe.PaymentIntent & { receipt_email?: string | null }).receipt_email)
    );
    stripeSales = paid.reduce((sum, pi) => sum + (pi.amount ?? 0) / 100, 0);
    stripeSalesCount = paid.length;
  } catch (err) {
    stripeError = String(err);
  }

  // ── Compute P&L ──────────────────────────────────────────
  const roas = metaSpend > 0 ? stripeSales / metaSpend : 0;
  const netProfit = stripeSales - BREAKEVEN_ROAS * metaSpend;
  const isProfit = netProfit >= 0;

  // ── Build Slack message ──────────────────────────────────
  // Date label uses the Dubai-day-just-ended (sinceMs in UTC+4).
  const dubaiDayEndedDate = new Date(sinceMs + 4 * 3600 * 1000); // shift to Dubai for label
  const dateLabel = dubaiDayEndedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Dubai",
  });

  const fmtUsd = (n: number) =>
    n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
  const fmtUsdAbs = (n: number) => `$${n.toFixed(2)}`;

  const headerEmoji = isProfit ? ":rocket:" : ":rotating_light:";
  const headerWord = isProfit ? "Profit" : "Loss";
  const headerLine = `${headerEmoji} *Daily Report — ${dateLabel}*`;

  // Tone line — celebrate wins, factual on losses.
  let toneLine: string;
  if (isProfit && roas >= 2.0) toneLine = `:fire: *Crushing it. ROAS ${roas.toFixed(2)}, net ${fmtUsd(netProfit)}.*`;
  else if (isProfit && roas >= 1.5) toneLine = `:dollar: *Profitable day. Net ${fmtUsd(netProfit)}.*`;
  else if (isProfit) toneLine = `:white_check_mark: *Above breakeven. Net ${fmtUsd(netProfit)}.*`;
  else if (roas >= 1.0) toneLine = `:warning: *Above 1× ROAS but below breakeven. Net ${fmtUsd(netProfit)}.*`;
  else toneLine = `:rotating_light: *Below 1× ROAS. Net ${fmtUsd(netProfit)}.*`;

  const errLines: string[] = [];
  if (metaError) errLines.push(`:warning: Meta API error: \`${metaError.slice(0, 200)}\``);
  if (stripeError) errLines.push(`:warning: Stripe error: \`${stripeError.slice(0, 200)}\``);

  // Use attachment color for the green/red bar on the left.
  const color = isProfit ? "#2eb886" : "#e01e5a";

  const attachment = {
    color,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `${isProfit ? "💰" : "🔻"} Daily Report — ${dateLabel}` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: toneLine },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Spend Meta*\n${fmtUsdAbs(metaSpend)}` },
          { type: "mrkdwn", text: `*Sales Stripe*\n${fmtUsdAbs(stripeSales)} _(${stripeSalesCount} ${stripeSalesCount === 1 ? "vente" : "ventes"})_` },
          { type: "mrkdwn", text: `*ROAS*\n${roas.toFixed(2)}× _(breakeven ${BREAKEVEN_ROAS}×)_` },
          { type: "mrkdwn", text: `*Net P&L*\n${fmtUsd(netProfit)}` },
        ],
      },
      ...(errLines.length > 0 ? [{
        type: "section",
        text: { type: "mrkdwn", text: errLines.join("\n") },
      }] : []),
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `_Period: last 24h ending ${new Date(untilMs).toISOString().slice(0, 16)}Z · ${headerWord} = sales − 1.2 × spend_` },
        ],
      },
    ],
  };

  await postToSlack("report", {
    text: `${headerLine} — Spend ${fmtUsdAbs(metaSpend)} · Sales ${fmtUsdAbs(stripeSales)} · ROAS ${roas.toFixed(2)}× · Net ${fmtUsd(netProfit)}`,
    attachments: [attachment],
  });

  return NextResponse.json({
    ok: true,
    metaSpend,
    stripeSales,
    stripeSalesCount,
    roas,
    netProfit,
    isProfit,
    metaError,
    stripeError,
  });
}
