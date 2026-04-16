import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

const VALID_STATUSES = new Set([
  "not_started",
  "questionnaire_in_progress",
  "questionnaire_submitted",
  "in_review",
  "delivered",
]);

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = request.nextUrl.searchParams.get("status");

  let query = supabaseAdmin
    .from("users")
    .select(`
      id, email, first_name, protocol_status, created_at, has_paid,
      questionnaire_responses(submitted_at)
    `)
    .eq("has_paid", true)
    .order("created_at", { ascending: false });

  if (status && VALID_STATUSES.has(status)) {
    query = query.eq("protocol_status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin/orders] fetch failed", error.message);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  const orders = (data ?? []).map((u) => {
    const qr = Array.isArray(u.questionnaire_responses)
      ? u.questionnaire_responses[0]
      : u.questionnaire_responses;
    return {
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      protocol_status: u.protocol_status,
      created_at: u.created_at,
      submitted_at: (qr as { submitted_at?: string } | null)?.submitted_at ?? null,
    };
  });

  return NextResponse.json({ orders });
}
