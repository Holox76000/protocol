import { NextResponse } from "next/server";
import {
  getOrCreateDatingOrder,
  isValidCheckoutSessionId,
  orderPhotosPrefix,
  syncOrderPhotos,
} from "../../../../lib/datingOrders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { session_id?: string; path?: string };
  const sessionId = body.session_id;

  if (!isValidCheckoutSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }
  if (!body.path || !body.path.startsWith(`${orderPhotosPrefix(sessionId)}/source-`)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const order = await getOrCreateDatingOrder(sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "paid") {
    return NextResponse.json({ error: "Photos already submitted for this order" }, { status: 409 });
  }

  // Source of truth is the storage listing — idempotent under retries and
  // concurrent uploads.
  const paths = await syncOrderPhotos(order.id, sessionId);
  return NextResponse.json({ photosCount: paths.length });
}
