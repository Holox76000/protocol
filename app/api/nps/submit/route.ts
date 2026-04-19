import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

type NpsCategory = "promoter" | "passive" | "detractor";

function getCategory(score: number): NpsCategory {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, score, answers, testimonial } = body as Record<string, unknown>;

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (typeof score !== "number" || score < 1 || score > 10) {
    return NextResponse.json({ error: "Score must be 1-10" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Detect initial vs 30d survey by which token column matches
  const { data: byInitial } = await supabaseAdmin
    .from("users")
    .select("id, nps_submitted_at")
    .eq("nps_token", token)
    .maybeSingle();

  const { data: by30d } = await supabaseAdmin
    .from("users")
    .select("id, nps_30d_submitted_at")
    .eq("nps_30d_token", token)
    .maybeSingle();

  const user = byInitial ?? by30d;
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  const category = getCategory(score);
  const is30d = !!by30d;

  // Idempotency guard — already submitted
  const alreadySubmitted = is30d
    ? !!(by30d as typeof by30d & { nps_30d_submitted_at?: string | null })?.nps_30d_submitted_at
    : !!(byInitial as typeof byInitial & { nps_submitted_at?: string | null })?.nps_submitted_at;

  if (alreadySubmitted) {
    return NextResponse.json({ category });
  }

  if (is30d) {
    await supabaseAdmin
      .from("users")
      .update({
        nps_30d_score: score,
        nps_30d_submitted_at: now,
        nps_30d_answers: answers ?? null,
      })
      .eq("id", user.id);
  } else {
    await supabaseAdmin
      .from("users")
      .update({
        nps_score: score,
        nps_category: category,
        nps_submitted_at: now,
        nps_answers: answers ?? null,
        nps_testimonial: testimonial ?? null,
      })
      .eq("id", user.id);
  }

  return NextResponse.json({ category });
}
