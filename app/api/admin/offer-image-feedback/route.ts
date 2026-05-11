import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

const BUCKET = "offer-images";
const FEEDBACK_PATH = "_feedback.json";

async function loadFeedback(): Promise<Record<string, unknown>> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(FEEDBACK_PATH);
  if (error || !data) return {};
  try {
    return JSON.parse(await data.text());
  } catch {
    return {};
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feedback = await loadFeedback();
  return NextResponse.json(feedback);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const current = await loadFeedback();
  const merged = { ...current, ...body };

  const bytes = Buffer.from(JSON.stringify(merged, null, 2));
  await supabaseAdmin.storage.from(BUCKET).upload(FEEDBACK_PATH, bytes, {
    contentType: "application/json",
    upsert: true,
  });

  return NextResponse.json({ ok: true });
}
