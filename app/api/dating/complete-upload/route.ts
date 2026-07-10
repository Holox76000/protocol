import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { postToSlack } from "../../../../lib/slack";
import {
  getOrCreateDatingOrder,
  isValidCheckoutSessionId,
  syncOrderPhotos,
} from "../../../../lib/datingOrders";

export const runtime = "nodejs";

const MIN_PHOTOS = 6;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { session_id?: string };
  const sessionId = body.session_id;

  if (!isValidCheckoutSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const order = await getOrCreateDatingOrder(sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotent: a repeat POST (double-click, stale tab) must not regress a
  // delivered order or re-fire the Slack ping.
  if (order.status !== "paid") {
    return NextResponse.json({ ok: true, photosCount: order.photos_count });
  }

  // Count from storage, not the jsonb column — self-heals any drift from
  // concurrent uploads or missed record calls.
  const paths = await syncOrderPhotos(order.id, order.stripe_session_id);
  if (paths.length < MIN_PHOTOS) {
    return NextResponse.json(
      { error: `At least ${MIN_PHOTOS} photos required`, photosCount: paths.length },
      { status: 400 }
    );
  }

  const { data: transitioned, error } = await supabaseAdmin
    .from("dating_orders")
    .update({ status: "photos_uploaded", photos_uploaded_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "paid")
    .select("id");

  if (error) {
    console.error("[dating/complete-upload] transition failed", { error: error.message });
    return NextResponse.json({ error: "Could not complete the order" }, { status: 500 });
  }

  if (transitioned && transitioned.length > 0) {
    await postToSlack("sales", {
      text: `📸 Dating photos uploaded — ${order.email}, ${paths.length} photos (order …${order.stripe_session_id.slice(-8)})`,
    });
  }

  return NextResponse.json({ ok: true, photosCount: paths.length });
}
