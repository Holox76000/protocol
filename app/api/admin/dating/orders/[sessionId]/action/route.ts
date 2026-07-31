// Manual admin actions on a dating order.
// POST /api/admin/dating/orders/[sessionId]/action
// Body: { action: "generate" | "deliver" | "regenerate" }
//
// - generate:   status must be paid|photos_uploaded → CAS to `generating`,
//               run generation (holdBeforeDelivery=false so deliver_at=now,
//               ready for admin review). Blocking, ~15-30s.
// - regenerate: status must be generated|delivered|failed → reset to
//               photos_uploaded, then run generate.
// - deliver:    status must be generated → releaseOrder() = flip to
//               delivered, send email, ping Slack.

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../../lib/supabase";
import {
  generateForOrder,
  releaseOrder,
  type GenerationOrder,
  type ReleaseOrder,
} from "../../../../../../../lib/datingGeneration";
import { isValidCheckoutSessionId } from "../../../../../../../lib/datingOrders";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ORDER_COLS = "id, stripe_session_id, email, first_name, status, output_count, photos_uploaded_at, created_at, amount_cents, utm_source, utm_campaign, utm_content, slack_sales_thread_ts, selected_ref_paths, upsell_priority, upsell_luxury";

type Action = "generate" | "deliver" | "regenerate";

async function runGenerate(sessionId: string) {
  const { data: order, error } = await supabaseAdmin
    .from("dating_orders")
    .select(ORDER_COLS)
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (error) return { ok: false, error: `fetch: ${error.message}` };
  if (!order) return { ok: false, error: "order not found" };
  if (order.status !== "paid" && order.status !== "photos_uploaded") {
    return { ok: false, error: `cannot generate from status "${order.status}" — regenerate instead` };
  }

  // CAS to generating so a concurrent cron tick doesn't grab it.
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
  if (claimErr) return { ok: false, error: `claim: ${claimErr.message}` };
  if (!claimed || claimed.length === 0) return { ok: false, error: "already claimed by another process" };

  // Admin manual → holdBeforeDelivery=false so deliver_at=now (ready to
  // release with the deliver action; not auto-released).
  return dispatchGeneration(sessionId, order.id, order as GenerationOrder, { holdBeforeDelivery: false });
}

async function rollbackToUploaded(orderId: string, error: string) {
  await supabaseAdmin
    .from("dating_orders")
    .update({ status: "photos_uploaded", generation_error: error })
    .eq("id", orderId);
}

// Generation makes one image per active template (30 core, 47 with luxury),
// which exceeds the 60s function timeout. In production hand off to the
// 15-min background function and return immediately (the order is already
// claimed to `generating`; the UI polls via refresh). Locally (no Netlify)
// fall back to running inline.
async function dispatchGeneration(
  sessionId: string,
  orderId: string,
  order: GenerationOrder,
  opts: { holdBeforeDelivery: boolean },
): Promise<{ ok: boolean; queued?: boolean; generated?: number; error?: string }> {
  const siteUrl = process.env.URL ?? process.env.NETLIFY_SITE_URL;
  if (siteUrl) {
    let bgRes: Response;
    try {
      bgRes = await fetch(`${siteUrl}/.netlify/functions/dating-generate-bg-background`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, holdBeforeDelivery: opts.holdBeforeDelivery, secret: process.env.BG_FN_SECRET }),
      });
    } catch (err) {
      await rollbackToUploaded(orderId, `bg dispatch error: ${String(err).slice(0, 200)}`);
      return { ok: false, error: "failed to start background generation" };
    }
    if (bgRes.status !== 202) {
      const t = await bgRes.text().catch(() => "");
      await rollbackToUploaded(orderId, `bg dispatch ${bgRes.status}: ${t.slice(0, 150)}`);
      return { ok: false, error: `failed to start background generation (${bgRes.status})` };
    }
    return { ok: true, queued: true };
  }

  // Local dev: run inline (old blocking behavior).
  try {
    const res = await generateForOrder(order, { holdBeforeDelivery: opts.holdBeforeDelivery });
    if (!res.ok) await rollbackToUploaded(orderId, res.error ?? "unknown");
    return res;
  } catch (err) {
    const msg = String(err).slice(0, 500);
    await rollbackToUploaded(orderId, msg);
    return { ok: false, error: msg };
  }
}

async function runDeliver(sessionId: string) {
  const { data: order, error } = await supabaseAdmin
    .from("dating_orders")
    .select(ORDER_COLS)
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (error) return { ok: false, error: `fetch: ${error.message}` };
  if (!order) return { ok: false, error: "order not found" };
  if (order.status !== "generated") {
    return { ok: false, error: `cannot deliver from status "${order.status}" — must be "generated"` };
  }
  return releaseOrder(order as ReleaseOrder);
}

async function runRegenerate(sessionId: string) {
  const { data: order, error } = await supabaseAdmin
    .from("dating_orders")
    .select("id, status")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (error) return { ok: false, error: `fetch: ${error.message}` };
  if (!order) return { ok: false, error: "order not found" };

  // Reset to photos_uploaded (drop output metadata but keep the storage
  // files — generateForOrder uses upsert so they'll be overwritten).
  const { error: resetErr } = await supabaseAdmin
    .from("dating_orders")
    .update({
      status: "photos_uploaded",
      output_paths: [],
      output_count: 0,
      generation_cost_cents: null,
      generation_error: null,
      generated_at: null,
      deliver_at: null,
      delivered_at: null,
    })
    .eq("id", order.id);
  if (resetErr) return { ok: false, error: `reset: ${resetErr.message}` };

  return runGenerate(sessionId);
}

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { sessionId: rawSessionId } = await params;
  const sessionId = decodeURIComponent(rawSessionId);
  if (!isValidCheckoutSessionId(sessionId)) {
    return NextResponse.json({ error: "invalid session_id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: Action };
  const action = body.action;
  if (!action || !["generate", "deliver", "regenerate"].includes(action)) {
    return NextResponse.json({ error: "action must be one of: generate, deliver, regenerate" }, { status: 400 });
  }

  let result;
  switch (action) {
    case "generate":   result = await runGenerate(sessionId);   break;
    case "regenerate": result = await runRegenerate(sessionId); break;
    case "deliver":    result = await runDeliver(sessionId);    break;
  }

  const status = result.ok ? 200 : (result.error?.includes("not found") ? 404 : 409);
  return NextResponse.json(result, { status });
}
