// POST /api/admin/dating/orders/[sessionId]/photo/[templateSlug]/regenerate
// Body: optional { feedback?: string } — if provided, saves it before
//       regenerating so the correction lands in the prompt this run.
//
// Re-runs Nano Banana for a single (order, template) pair. Uses any
// stored feedback (from prior /feedback POST OR from this request's
// body) as a corrective clause in the prompt. Overwrites the existing
// output file at dating-photos/orders/{sid}/output/{slug}.jpg.
//
// Sync response — waits for the single Nano Banana call to complete
// (~10-15s). Admin gets the new signed URL to render inline.

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../../../../lib/supabase";
import { isValidCheckoutSessionId } from "../../../../../../../../../lib/datingOrders";
import { regenerateSingleTemplate } from "../../../../../../../../../lib/datingGeneration";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_FEEDBACK_LENGTH = 2000;
const SIGNED_URL_TTL_SEC = 3600;

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
  const incomingFeedback = (body.feedback ?? "").trim().slice(0, MAX_FEEDBACK_LENGTH);

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("dating_orders")
    .select("id, stripe_session_id, generation_cost_cents, feedback_by_template")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

  // Merge: if body includes feedback, persist it first so subsequent
  // regens (with no body) still use it.
  const stored = (order.feedback_by_template as Record<string, string> | null) ?? {};
  let effectiveFeedback = stored[templateSlug] ?? null;

  if (incomingFeedback) {
    const nextMap = { ...stored, [templateSlug]: incomingFeedback };
    const { error: fbErr } = await supabaseAdmin
      .from("dating_orders")
      .update({ feedback_by_template: nextMap })
      .eq("id", order.id);
    if (fbErr) return NextResponse.json({ error: `save feedback: ${fbErr.message}` }, { status: 500 });
    effectiveFeedback = incomingFeedback;
  }

  const res = await regenerateSingleTemplate({
    order: {
      id: order.id as string,
      stripe_session_id: order.stripe_session_id as string,
      generation_cost_cents: (order.generation_cost_cents as number | null) ?? null,
    },
    templateSlug,
    feedback: effectiveFeedback,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error ?? "generation failed" }, { status: 502 });
  }

  // Sign the new file so the admin can preview it immediately without
  // waiting for the page refresh.
  let newSignedUrl: string | null = null;
  if (res.path) {
    const { data: signed } = await supabaseAdmin.storage
      .from("dating-photos")
      .createSignedUrl(res.path, SIGNED_URL_TTL_SEC);
    newSignedUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json({
    ok: true,
    path: res.path,
    signedUrl: newSignedUrl,
    feedbackUsed: effectiveFeedback,
  });
}
