// POST /api/admin/dating/orders/[sessionId]/photo/[templateSlug]/feedback
// Body: { feedback: string }  (empty string clears the feedback for that slug)
//
// Saves the admin's per-photo feedback on dating_orders.feedback_by_template
// (jsonb keyed by template slug). Used by the single-photo regenerate action
// to inject a corrective clause into the next prompt.

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../../../../lib/supabase";
import { isValidCheckoutSessionId } from "../../../../../../../../../lib/datingOrders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FEEDBACK_LENGTH = 2000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; templateSlug: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { sessionId: rawSessionId, templateSlug: rawSlug } = await params;
  const sessionId = decodeURIComponent(rawSessionId);
  const templateSlug = decodeURIComponent(rawSlug);

  if (!isValidCheckoutSessionId(sessionId)) {
    return NextResponse.json({ error: "invalid session_id" }, { status: 400 });
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(templateSlug)) {
    return NextResponse.json({ error: "invalid template slug" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { feedback?: string };
  const feedback = (body.feedback ?? "").trim().slice(0, MAX_FEEDBACK_LENGTH);

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("dating_orders")
    .select("id, feedback_by_template")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

  const current = (order.feedback_by_template as Record<string, string> | null) ?? {};
  const next = { ...current };
  if (feedback) {
    next[templateSlug] = feedback;
  } else {
    delete next[templateSlug];
  }

  const { error: upErr } = await supabaseAdmin
    .from("dating_orders")
    .update({ feedback_by_template: next })
    .eq("id", order.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, feedback: next[templateSlug] ?? null });
}
