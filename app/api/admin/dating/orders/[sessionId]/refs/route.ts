// POST /api/admin/dating/orders/[sessionId]/refs
// Body: { paths: string[] }  (up to 4; empty array = fall back to auto)
//
// Persists the admin's picked subset of source selfies on the order.
// Validates every path belongs to this order's source/ prefix so an
// admin can't accidentally (or maliciously) reference someone else's
// photos.

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../../lib/supabase";
import {
  isValidCheckoutSessionId,
  orderPhotosPrefix,
} from "../../../../../../../lib/datingOrders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REFS = 4;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { sessionId: rawSessionId } = await params;
  const sessionId = decodeURIComponent(rawSessionId);
  if (!isValidCheckoutSessionId(sessionId)) {
    return NextResponse.json({ error: "invalid session_id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { paths?: unknown };
  const rawPaths = Array.isArray(body.paths) ? body.paths : [];

  const expectedPrefix = `${orderPhotosPrefix(sessionId)}/source-`;
  const paths: string[] = [];
  for (const p of rawPaths) {
    if (typeof p !== "string") continue;
    if (!p.startsWith(expectedPrefix)) continue; // paranoia: enforce scope
    paths.push(p);
    if (paths.length >= MAX_REFS) break;
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("dating_orders")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

  const { error: upErr } = await supabaseAdmin
    .from("dating_orders")
    .update({ selected_ref_paths: paths })
    .eq("id", order.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, paths, count: paths.length });
}
