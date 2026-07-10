import { NextResponse } from "next/server";
import { getOrCreateDatingOrder, isValidCheckoutSessionId } from "../../../../lib/datingOrders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!isValidCheckoutSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const order = await getOrCreateDatingOrder(sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    email: order.email,
    photosCount: order.photos_count,
  });
}
