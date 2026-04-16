import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabase";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    overlay_points?: unknown;
    metrics?: unknown;
  };

  const { error } = await supabaseAdmin
    .from("protocols")
    .upsert(
      { user_id: params.userId, overlay_points: body.overlay_points, metrics: body.metrics },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[admin/calibration] upsert failed", error.message);
    return NextResponse.json({ error: "Failed to save calibration" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
