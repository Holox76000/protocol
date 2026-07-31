import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { generateForOrder, releaseOrder } from "../../../../lib/datingGeneration";

export const runtime = "nodejs";
export const maxDuration = 60;

// One order per tick — keeps us well under the 60s function timeout even
// in worst case (30-40s for a full 9-template generation).
const ORDERS_PER_TICK = 1;

// Resurrection window: an order stuck in `generating` past this is presumed
// crashed and gets picked back up.
const STUCK_MINUTES = 30;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const summary: {
    released: Array<{ orderId: string; ok: boolean; error?: string }>;
    generated: Array<{ orderId: string; ok: boolean; generated?: number; deliverAt?: string; error?: string }>;
  } = { released: [], generated: [] };

  // ── Phase 2 first: release any generated orders whose hold has expired.
  // Cheap query (indexed on status+deliver_at), no external API calls, so
  // we do it every tick regardless of generation load.
  const { data: dueOrders, error: dueErr } = await supabaseAdmin
    .from("dating_orders")
    .select("id, stripe_session_id, email, first_name, output_count, amount_cents, utm_source, utm_campaign, utm_content, slack_sales_thread_ts")
    .eq("status", "generated")
    .lte("deliver_at", nowIso)
    .order("deliver_at", { ascending: true })
    .limit(20);

  if (dueErr) {
    console.error("[cron/dating-generate] fetch due orders failed", { error: dueErr.message });
  } else {
    for (const order of dueOrders ?? []) {
      const res = await releaseOrder(order);
      summary.released.push({ orderId: order.id, ...res });
    }
  }

  // ── Phase 1: generate one fresh order per tick. Candidates are
  // `photos_uploaded` or `generating` stuck > STUCK_MINUTES (crashed
  // mid-run). Oldest-first FIFO.
  const stuckCutoff = new Date(Date.now() - STUCK_MINUTES * 60 * 1000).toISOString();

  const { data: candidates, error: fetchErr } = await supabaseAdmin
    .from("dating_orders")
    .select("id, stripe_session_id, email, first_name, status, generation_started_at, photos_uploaded_at, created_at, amount_cents, utm_source, utm_campaign, utm_content, slack_sales_thread_ts, selected_ref_paths, upsell_priority, upsell_luxury")
    .or(
      `status.eq.photos_uploaded,and(status.eq.generating,generation_started_at.lt.${stuckCutoff})`
    )
    .order("photos_uploaded_at", { ascending: true, nullsFirst: false })
    .limit(ORDERS_PER_TICK);

  if (fetchErr) {
    console.error("[cron/dating-generate] fetch candidates failed", { error: fetchErr.message });
    return NextResponse.json({ error: "fetch failed", released: summary.released.length }, { status: 500 });
  }

  for (const order of candidates ?? []) {
    // CAS claim: two concurrent ticks can't grab the same order.
    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from("dating_orders")
      .update({
        status: "generating",
        generation_started_at: new Date().toISOString(),
        generation_error: null,
      })
      .eq("id", order.id)
      .eq("status", order.status)
      .select("id");

    if (claimErr) {
      summary.generated.push({ orderId: order.id, ok: false, error: `claim: ${claimErr.message}` });
      continue;
    }
    if (!claimed || claimed.length === 0) {
      summary.generated.push({ orderId: order.id, ok: false, error: "already claimed" });
      continue;
    }

    // Generation makes one image per active template (30 core, 47 with luxury),
    // which exceeds this cron's 60s budget. Hand off to the 15-min background
    // function (order is already claimed to `generating`). Locally, run inline.
    const siteUrl = process.env.URL ?? process.env.NETLIFY_SITE_URL;
    if (siteUrl) {
      try {
        const bgRes = await fetch(`${siteUrl}/.netlify/functions/dating-generate-bg-background`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: order.stripe_session_id, holdBeforeDelivery: true, secret: process.env.BG_FN_SECRET }),
        });
        if (bgRes.status !== 202) {
          const t = await bgRes.text().catch(() => "");
          await supabaseAdmin
            .from("dating_orders")
            .update({ status: "photos_uploaded", generation_error: `bg dispatch ${bgRes.status}: ${t.slice(0, 150)}` })
            .eq("id", order.id);
          summary.generated.push({ orderId: order.id, ok: false, error: `bg dispatch ${bgRes.status}` });
        } else {
          summary.generated.push({ orderId: order.id, ok: true });
        }
      } catch (err) {
        const msg = String(err).slice(0, 500);
        await supabaseAdmin
          .from("dating_orders")
          .update({ status: "photos_uploaded", generation_error: msg })
          .eq("id", order.id);
        summary.generated.push({ orderId: order.id, ok: false, error: msg });
      }
    } else {
      try {
        const res = await generateForOrder(order);
        summary.generated.push({ orderId: order.id, ...res });
        if (!res.ok) {
          await supabaseAdmin
            .from("dating_orders")
            .update({ status: "photos_uploaded", generation_error: res.error ?? "unknown" })
            .eq("id", order.id);
        }
      } catch (err) {
        const msg = String(err).slice(0, 500);
        console.error("[cron/dating-generate] generateForOrder crashed", { orderId: order.id, msg });
        await supabaseAdmin
          .from("dating_orders")
          .update({ status: "photos_uploaded", generation_error: msg })
          .eq("id", order.id);
        summary.generated.push({ orderId: order.id, ok: false, error: msg });
      }
    }
  }

  return NextResponse.json({ ok: true, ...summary });
}
