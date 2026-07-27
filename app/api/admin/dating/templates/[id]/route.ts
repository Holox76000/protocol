// Per-template admin endpoints: PATCH (fields), DELETE (row + storage).
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { getTemplateById } from "../../../../../../lib/datingTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "dating-photos";

// PATCH — update label, prompt, active, sort_order. Slug + image are
// immutable via PATCH; delete + recreate if you need to change either.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    label?: string;
    prompt?: string;
    active?: boolean;
    sort_order?: number;
  };

  const update: Record<string, unknown> = {};
  if (typeof body.label === "string" && body.label.trim()) update.label = body.label.trim();
  if (typeof body.prompt === "string" && body.prompt.trim()) update.prompt = body.prompt.trim();
  if (typeof body.active === "boolean") update.active = body.active;
  if (typeof body.sort_order === "number") update.sort_order = body.sort_order;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no updatable fields provided" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("dating_templates")
    .update(update)
    .eq("id", id)
    .select("id, slug, label, active, sort_order")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "template not found" }, { status: 404 });

  return NextResponse.json({ ok: true, template: data });
}

// DELETE — removes the row AND the storage file. Idempotent: 404 if the
// row is already gone; storage remove is best-effort.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getTemplateById(id);
  if (!existing) return NextResponse.json({ error: "template not found" }, { status: 404 });

  const { error: delErr } = await supabaseAdmin
    .from("dating_templates")
    .delete()
    .eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // Best-effort storage cleanup — the row is gone, don't fail the request
  // if the file was already removed.
  const { error: rmErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([existing.refImagePath]);
  if (rmErr) {
    console.warn("[admin/dating/templates] storage remove failed (row was deleted anyway)", {
      error: rmErr.message, path: existing.refImagePath,
    });
  }

  return NextResponse.json({ ok: true });
}
