// Admin CRUD for dating_templates. requireAdmin gates every handler.
// POST is multipart: image file + label + slug + prompt + active.
// Ref image is stored under dating-photos/templates/{slug}.{ext}.

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { labelToSlug, loadAllTemplates } from "../../../../../lib/datingTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "dating-photos";
const TEMPLATES_PREFIX = "templates";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// GET /api/admin/dating/templates — list all
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const templates = await loadAllTemplates();
  return NextResponse.json({ templates });
}

// POST /api/admin/dating/templates — create (multipart)
// Fields: image (file), label, slug (optional, auto-derived), prompt, active, sort_order
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "multipart body required" }, { status: 400 });
  }

  const image = form.get("image");
  const label = String(form.get("label") ?? "").trim();
  const rawSlug = String(form.get("slug") ?? "").trim();
  const prompt = String(form.get("prompt") ?? "").trim();
  const active = form.get("active") !== "false"; // default true
  const sortOrder = Number(form.get("sort_order") ?? 0) || 0;

  if (!label) return NextResponse.json({ error: "label required" }, { status: 400 });
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });
  if (!(image instanceof File)) return NextResponse.json({ error: "image file required" }, { status: 400 });

  if (!ALLOWED_MIME.has(image.type)) {
    return NextResponse.json({ error: `unsupported image type ${image.type}` }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: `image too large (>${MAX_IMAGE_BYTES / 1024 / 1024}MB)` }, { status: 400 });
  }

  const slug = rawSlug || labelToSlug(label);
  if (!SLUG_RE.test(slug) || slug.length < 2 || slug.length > 60) {
    return NextResponse.json({ error: `invalid slug "${slug}" — must be kebab-case a-z0-9, 2-60 chars` }, { status: 400 });
  }

  // Upload image first. If DB insert fails we'd have an orphan file — we
  // clean it up on failure paths below.
  const ext = extForMime(image.type);
  const refPath = `${TEMPLATES_PREFIX}/${slug}.${ext}`;
  const arrayBuf = await image.arrayBuffer();
  const { error: upErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(refPath, Buffer.from(arrayBuf), {
      contentType: image.type,
      upsert: false, // fail loudly if slug collision at storage layer
    });
  if (upErr) {
    return NextResponse.json({ error: `image upload failed: ${upErr.message}` }, { status: upErr.message.includes("exists") ? 409 : 500 });
  }

  const { data, error: insErr } = await supabaseAdmin
    .from("dating_templates")
    .insert({
      slug,
      label,
      prompt,
      ref_image_path: refPath,
      active,
      sort_order: sortOrder,
    })
    .select("id, slug, label")
    .single();

  if (insErr) {
    // Roll back the storage upload so we don't leak orphan files.
    await supabaseAdmin.storage.from(BUCKET).remove([refPath]).catch(() => {});
    if (insErr.message.includes("duplicate")) {
      return NextResponse.json({ error: `slug "${slug}" already exists` }, { status: 409 });
    }
    return NextResponse.json({ error: `insert failed: ${insErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, template: data });
}
