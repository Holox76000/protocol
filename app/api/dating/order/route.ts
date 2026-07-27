import { NextResponse } from "next/server";
import { getOrCreateDatingOrder, isValidCheckoutSessionId } from "../../../../lib/datingOrders";
import { isQuestionnaireComplete } from "../../../../lib/datingQuestionnaire";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!isValidCheckoutSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const order = await getOrCreateDatingOrder(sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    email: order.email,
    photosCount: order.photos_count,
    // Client decides between "show questionnaire" and "show upload" based
    // on this flag. Also returns the current answers so a customer who
    // partially filled in and refreshed sees their in-progress state.
    questionnaireDone: isQuestionnaireComplete(order.questionnaire_answers),
    questionnaireAnswers: order.questionnaire_answers ?? null,
    upsellPriority: order.upsell_priority,
    upsellLuxury: order.upsell_luxury,
  });
}
