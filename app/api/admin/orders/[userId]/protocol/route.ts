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

  const body = (await request.json().catch(() => ({}))) as { content?: string };
  const content = body.content ?? "";

  const { error } = await supabaseAdmin
    .from("protocols")
    .upsert({ user_id: params.userId, content }, { onConflict: "user_id" });

  if (error) {
    console.error("[admin/protocol] upsert failed", error.message);
    return NextResponse.json({ error: "Failed to save protocol" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
