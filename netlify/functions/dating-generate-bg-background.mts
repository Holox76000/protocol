// Background function: run a full Protocol Dating generation for ONE order.
//
// Why this exists: generateForOrder makes one Nano Banana call PER active
// template (30 core, 47 with the luxury upsell) with retries. That far exceeds
// the 60s timeout of a normal serverless function — the synchronous admin/cron
// path returned an HTML 504 that the caller then tried to JSON.parse
// ("Unexpected token '<'"). Netlify *-background functions run up to 15 minutes,
// which comfortably fits a 30-47 image fan-out.
//
// The caller (admin action route or the cron) CAS-claims the order to
// `generating` first, then fire-and-forgets to this function. Here we just run
// the generation and roll the order back to `photos_uploaded` on failure so the
// cron's resurrection window can retry it.

import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "../../lib/supabase";
import { generateForOrder, type GenerationOrder } from "../../lib/datingGeneration";

const ORDER_COLS =
  "id, stripe_session_id, email, first_name, status, output_count, photos_uploaded_at, created_at, amount_cents, utm_source, utm_campaign, utm_content, slack_sales_thread_ts, selected_ref_paths, upsell_priority, upsell_luxury";

const handler: Handler = async (event) => {
  let body: { sessionId?: string; holdBeforeDelivery?: boolean; secret?: string } = {};
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { sessionId, secret } = body;
  const holdBeforeDelivery = body.holdBeforeDelivery !== false; // default true (matches generateForOrder)

  if (secret !== process.env.BG_FN_SECRET) {
    console.error("[dating-generate-bg] Invalid secret");
    return { statusCode: 401, body: "Unauthorized" };
  }
  if (!sessionId) return { statusCode: 400, body: "sessionId required" };

  const { data: order, error } = await supabaseAdmin
    .from("dating_orders")
    .select(ORDER_COLS)
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error) {
    console.error("[dating-generate-bg] fetch failed", { error: error.message, sessionId });
    return { statusCode: 200, body: "done (fetch error)" };
  }
  if (!order) {
    console.error("[dating-generate-bg] order not found", { sessionId });
    return { statusCode: 200, body: "done (order not found)" };
  }

  try {
    const res = await generateForOrder(order as unknown as GenerationOrder, { holdBeforeDelivery });
    if (!res.ok) {
      await supabaseAdmin
        .from("dating_orders")
        .update({ status: "photos_uploaded", generation_error: res.error ?? "unknown" })
        .eq("id", (order as { id: string }).id);
      return { statusCode: 200, body: `done (gen failed: ${res.error ?? "unknown"})` };
    }
    console.log(`[dating-generate-bg] done — ${res.generated ?? "?"} photos for ${sessionId}`);
    return { statusCode: 200, body: `done (${res.generated ?? "?"} photos)` };
  } catch (err) {
    const msg = String(err).slice(0, 500);
    console.error("[dating-generate-bg] crashed", { sessionId, msg });
    await supabaseAdmin
      .from("dating_orders")
      .update({ status: "photos_uploaded", generation_error: msg })
      .eq("id", (order as { id: string }).id);
    return { statusCode: 200, body: "done (error)" };
  }
};

export { handler };
