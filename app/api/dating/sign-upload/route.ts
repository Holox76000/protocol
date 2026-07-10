import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import {
  getOrCreateDatingOrder,
  isValidCheckoutSessionId,
  orderPhotosPrefix,
} from "../../../../lib/datingOrders";

export const runtime = "nodejs";

const MAX_PHOTOS = 12;
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "heic", "heif", "webp"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { session_id?: string; ext?: string };
  const sessionId = body.session_id;
  const ext = (body.ext ?? "").toLowerCase();

  if (!isValidCheckoutSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }
  if (!ALLOWED_EXTS.has(ext)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const order = await getOrCreateDatingOrder(sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "paid") {
    return NextResponse.json({ error: "Photos already submitted for this order" }, { status: 409 });
  }
  if (order.photos_count >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos per order` }, { status: 400 });
  }

  const path = `${orderPhotosPrefix(sessionId)}/source-${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabaseAdmin.storage
    .from("dating-photos")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[dating/sign-upload] sign failed", { error: error?.message, path });
    return NextResponse.json({ error: "Could not prepare upload" }, { status: 500 });
  }

  return NextResponse.json({ path: data.path, signedUrl: data.signedUrl, token: data.token });
}
