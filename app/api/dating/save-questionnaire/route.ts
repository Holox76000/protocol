// POST /api/dating/save-questionnaire
// Body: { session_id, answers: { [question_id]: option } }
// Persists the answers on the dating_orders row for the given session.
// Public endpoint (no auth) — a customer just paid and needs to hand
// their answers to the system before uploading photos. Guarded by
// (a) session_id shape validation and (b) an existence check on a
// paid dating order.
//
// Idempotent: overwrites answers if already present (customer might
// re-open the page and re-answer to fix a mistake before uploading).
// Rejects overwrites once the order has moved past photos_uploaded so
// we can't retroactively "influence" a delivery that's already going.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import {
  getOrCreateDatingOrder,
  isValidCheckoutSessionId,
} from "../../../../lib/datingOrders";
import {
  DATING_QUESTIONS,
  isQuestionnaireComplete,
  type DatingAnswers,
} from "../../../../lib/datingQuestionnaire";

export const runtime = "nodejs";

// Cap the payload to prevent bloat / abuse. Each answer is a short string
// picked from a small option set; a legit call is a few hundred bytes.
const MAX_ANSWER_LENGTH = 200;

function sanitize(rawAnswers: unknown): DatingAnswers | null {
  if (!rawAnswers || typeof rawAnswers !== "object") return null;
  const raw = rawAnswers as Record<string, unknown>;
  const validIds = new Set(DATING_QUESTIONS.map((q) => q.id));
  const clean: DatingAnswers = {};
  for (const [id, value] of Object.entries(raw)) {
    if (!validIds.has(id)) continue; // silently drop unknown ids
    if (typeof value !== "string") continue;
    const trimmed = value.trim().slice(0, MAX_ANSWER_LENGTH);
    if (!trimmed) continue;
    clean[id] = trimmed;
  }
  return Object.keys(clean).length > 0 ? clean : null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    session_id?: string;
    answers?: unknown;
  };
  const sessionId = body.session_id;

  if (!isValidCheckoutSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const answers = sanitize(body.answers);
  if (!answers) {
    return NextResponse.json({ error: "Invalid answers payload" }, { status: 400 });
  }
  if (!isQuestionnaireComplete(answers)) {
    return NextResponse.json(
      { error: "All questions must be answered", answered: Object.keys(answers).length, total: DATING_QUESTIONS.length },
      { status: 400 }
    );
  }

  const order = await getOrCreateDatingOrder(sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Freeze once photos are handed over — the answers shape the shoot,
  // it would be dishonest to let the customer edit them after generation.
  if (order.status !== "paid") {
    return NextResponse.json(
      { ok: true, note: "questionnaire is locked (order is beyond paid)", answers: order.questionnaire_answers },
      { status: 200 }
    );
  }

  const { error: upErr } = await supabaseAdmin
    .from("dating_orders")
    .update({ questionnaire_answers: answers })
    .eq("id", order.id);
  if (upErr) {
    console.error("[dating/save-questionnaire] update failed", { error: upErr.message, sessionId });
    return NextResponse.json({ error: "Could not save answers" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, answers });
}
