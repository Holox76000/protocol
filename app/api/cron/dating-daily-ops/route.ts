import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { opsChannelId, slackPostMessage, postToSlack } from "../../../../lib/slack";

export const runtime = "nodejs";
export const maxDuration = 30;

// Warn if an order has been in "photos_uploaded" longer than this — the
// generation cron should pick it up within minutes.
const STUCK_UPLOAD_MINUTES = 30;

// Warn if a generated order should have been released already.
const OVERDUE_RELEASE_MINUTES = 15;

// Report window = today in Europe/Paris (matches Meta ad account TZ + how
// we anchor the daily-report cron).
function todayParisRange(): { since: string; until: string; label: string } {
  const now = new Date();
  const parisNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const y = parisNow.getFullYear();
  const m = String(parisNow.getMonth() + 1).padStart(2, "0");
  const d = String(parisNow.getDate()).padStart(2, "0");
  const dayStr = `${y}-${m}-${d}`;

  // Paris midnight → UTC ms via offset probe (same trick as the daily-report script)
  const probe = new Date(Date.UTC(y, parisNow.getMonth(), parisNow.getDate(), 12));
  const parisStr = probe.toLocaleString("sv-SE", { timeZone: "Europe/Paris" });
  const utcStr = probe.toISOString().replace("T", " ").slice(0, 19);
  const diffMs = new Date(parisStr).getTime() - new Date(utcStr).getTime();
  const sinceMs = Date.UTC(y, parisNow.getMonth(), parisNow.getDate(), 0, 0, 0) - diffMs;

  return {
    since: new Date(sinceMs).toISOString(),
    until: new Date(sinceMs + 24 * 3600 * 1000).toISOString(),
    label: dayStr,
  };
}

type OrderRow = {
  id: string;
  stripe_session_id: string;
  email: string;
  status: string;
  amount_cents: number | null;
  photos_uploaded_at: string | null;
  generation_started_at: string | null;
  generated_at: string | null;
  deliver_at: string | null;
  delivered_at: string | null;
  generation_cost_cents: number | null;
  generation_error: string | null;
  output_count: number;
};

function fmtUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { since, until, label } = todayParisRange();
  const nowMs = Date.now();

  // Orders created today. Warnings additionally scan orders that landed
  // earlier but are still stuck in a mid-state today — otherwise a Monday
  // sale stuck 3 days would never surface.
  const { data: todaysOrders, error: todayErr } = await supabaseAdmin
    .from("dating_orders")
    .select("id, stripe_session_id, email, status, amount_cents, photos_uploaded_at, generation_started_at, generated_at, deliver_at, delivered_at, generation_cost_cents, generation_error, output_count")
    .gte("created_at", since)
    .lt("created_at", until)
    .order("created_at", { ascending: false });
  if (todayErr) {
    console.error("[cron/dating-daily-ops] fetch today failed", { error: todayErr.message });
    return NextResponse.json({ error: "fetch today failed" }, { status: 500 });
  }
  const orders = (todaysOrders ?? []) as OrderRow[];

  // Additionally: any lingering paid/uploaded/generated across all time — surfaces
  // orders older than today that are still not delivered.
  const { data: lingering } = await supabaseAdmin
    .from("dating_orders")
    .select("id, stripe_session_id, email, status, amount_cents, photos_uploaded_at, generation_started_at, generated_at, deliver_at, delivered_at, generation_cost_cents, generation_error, output_count")
    .in("status", ["paid", "photos_uploaded", "generating", "generated", "failed"])
    .lt("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);
  const oldLingering = (lingering ?? []) as OrderRow[];

  // ── Aggregates for today
  const revenue = orders.reduce((s, o) => s + (o.amount_cents ?? 0), 0);
  const genCost = orders.reduce((s, o) => s + (o.generation_cost_cents ?? 0), 0);
  const byStatus: Record<string, number> = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  const paid = byStatus.paid ?? 0;
  const uploaded = byStatus.photos_uploaded ?? 0;
  const generating = byStatus.generating ?? 0;
  const generated = byStatus.generated ?? 0;
  const delivered = byStatus.delivered ?? 0;
  const failed = byStatus.failed ?? 0;

  // ── Warnings across today AND lingering older orders
  const allWatch = [...orders, ...oldLingering];
  const warnings: string[] = [];

  const stuckUploads = allWatch.filter(o =>
    o.status === "photos_uploaded" &&
    o.photos_uploaded_at &&
    (nowMs - new Date(o.photos_uploaded_at).getTime()) > STUCK_UPLOAD_MINUTES * 60 * 1000
  );
  if (stuckUploads.length > 0) {
    warnings.push(
      `:warning: *${stuckUploads.length} order${stuckUploads.length > 1 ? "s" : ""} stuck in \`photos_uploaded\`* (>${STUCK_UPLOAD_MINUTES} min): ` +
      stuckUploads.slice(0, 5).map(o => `\`${o.email}\``).join(", ") +
      (stuckUploads.length > 5 ? ` +${stuckUploads.length - 5} more` : "")
    );
  }

  const overdueReleases = allWatch.filter(o =>
    o.status === "generated" &&
    o.deliver_at &&
    (nowMs - new Date(o.deliver_at).getTime()) > OVERDUE_RELEASE_MINUTES * 60 * 1000
  );
  if (overdueReleases.length > 0) {
    warnings.push(
      `:warning: *${overdueReleases.length} order${overdueReleases.length > 1 ? "s" : ""} past deliver_at* (\`generated\` >${OVERDUE_RELEASE_MINUTES} min overdue): ` +
      overdueReleases.slice(0, 5).map(o => `\`${o.email}\``).join(", ")
    );
  }

  const failedOrders = allWatch.filter(o => o.status === "failed");
  if (failedOrders.length > 0) {
    warnings.push(
      `:rotating_light: *${failedOrders.length} order${failedOrders.length > 1 ? "s" : ""} in \`failed\`* — needs manual look`
    );
  }

  const withGenError = allWatch.filter(o => o.generation_error && o.status !== "delivered");
  if (withGenError.length > 0) {
    warnings.push(
      `:warning: *${withGenError.length} order${withGenError.length > 1 ? "s" : ""} carrying a generation_error*: ` +
      withGenError.slice(0, 3).map(o => `\`${o.email}\` (${(o.generation_error ?? "").slice(0, 60)})`).join(" · ")
    );
  }

  // Consistency check: today's orders where paid > 1h ago but no upload yet
  // (the customer paid and left — normal but ops should see the number).
  const noUploadOldPaid = orders.filter(o =>
    o.status === "paid" &&
    (nowMs - new Date(since).getTime()) > 60 * 60 * 1000  // day is >1h old
  );

  // ── Build message
  const headerEmoji = warnings.length === 0 ? ":bar_chart:" : ":rotating_light:";
  const headerLine = `${headerEmoji} *Dating Ops — ${label}*`;

  const statusLine = [
    `Paid: *${paid}*`,
    `Uploaded: *${uploaded}*`,
    generating > 0 ? `Generating: *${generating}*` : null,
    `Generated (held): *${generated}*`,
    `Delivered: *${delivered}*`,
    failed > 0 ? `Failed: *${failed}*` : null,
  ].filter(Boolean).join("  ·  ");

  const money = revenue > 0
    ? `Revenue *${fmtUsd(revenue)}* · gen cost ${fmtUsd(genCost)} · gross margin *${fmtUsd(revenue - genCost)}* (${revenue > 0 ? Math.round(100 * (revenue - genCost) / revenue) : 0}%)`
    : "No paid orders today.";

  const funnelHint = paid + uploaded > 0
    ? `_Waiting on customer: ${paid} paid-no-upload, ${uploaded} uploaded-not-generated._`
    : "";

  const lines: string[] = [
    headerLine,
    `_${orders.length} order${orders.length !== 1 ? "s" : ""} today · Europe/Paris_`,
    "",
    statusLine,
    money,
  ];
  if (funnelHint) lines.push(funnelHint);
  if (noUploadOldPaid.length > 0 && noUploadOldPaid.length !== paid) {
    lines.push(`_${noUploadOldPaid.length} paid earlier today with no upload yet._`);
  }
  if (warnings.length > 0) {
    lines.push("");
    lines.push("*Warnings:*");
    for (const w of warnings) lines.push(w);
  } else {
    lines.push("");
    lines.push(":white_check_mark: No consistency warnings.");
  }

  const text = lines.join("\n");

  // Prefer bot (unified with sales feed) but fall back to webhook if the
  // token isn't set — the ops digest is a one-shot post so either path works.
  const chId = opsChannelId();
  if (chId) {
    const res = await slackPostMessage({ channelId: chId, text });
    if (!res.ok) {
      console.error("[cron/dating-daily-ops] bot post failed, falling back to webhook", { error: res.error });
      await postToSlack("ops", { text });
    }
  } else {
    await postToSlack("ops", { text });
  }

  return NextResponse.json({
    ok: true,
    label,
    counts: { orders: orders.length, paid, uploaded, generating, generated, delivered, failed },
    revenueCents: revenue,
    generationCostCents: genCost,
    warningsCount: warnings.length,
    lingeringOlderThanToday: oldLingering.length,
  });
}
