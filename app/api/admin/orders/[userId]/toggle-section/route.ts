import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabase";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sectionId, disabled } = (await request.json()) as {
    sectionId: string;
    disabled: boolean;
  };

  if (!sectionId) {
    return NextResponse.json({ error: "Missing sectionId" }, { status: 400 });
  }

  // Fetch current disabled_sections array
  const { data: proto, error: fetchErr } = await supabaseAdmin
    .from("protocols")
    .select("disabled_sections")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const current: string[] = (proto?.disabled_sections as string[]) ?? [];

  const updated = disabled
    ? current.includes(sectionId) ? current : [...current, sectionId]
    : current.filter((s) => s !== sectionId);

  const { error: updateErr } = await supabaseAdmin
    .from("protocols")
    .update({ disabled_sections: updated })
    .eq("user_id", params.userId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, disabledSections: updated });
}
