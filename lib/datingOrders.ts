import type Stripe from "stripe";
import { supabaseAdmin } from "./supabase";
import { getStripeServerClient } from "./stripe";

export type DatingOrder = {
  id: string;
  stripe_session_id: string;
  email: string;
  first_name: string | null;
  status: string;
  photo_paths: string[];
  photos_count: number;
  amount_cents: number | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  slack_sales_thread_ts: string | null;
  questionnaire_answers: Record<string, string> | null;
};

const ORDER_COLUMNS = "id, stripe_session_id, email, first_name, status, photo_paths, photos_count, amount_cents, utm_source, utm_campaign, utm_content, slack_sales_thread_ts, questionnaire_answers";

export function isValidCheckoutSessionId(id: string | null | undefined): id is string {
  return typeof id === "string" && /^cs_[A-Za-z0-9_]+$/.test(id);
}

// Photos live under this prefix; the browser uploads to signed URLs directly
// (Netlify Functions cap request bodies at ~6 MB, so files never transit the
// API). The storage listing is the source of truth for photo_paths — deriving
// from it makes record/complete idempotent and immune to concurrent-append
// races on the jsonb column.
export function orderPhotosPrefix(sessionId: string): string {
  return `orders/${sessionId}`;
}

export async function listOrderPhotoPaths(sessionId: string): Promise<string[]> {
  const prefix = orderPhotosPrefix(sessionId);
  const { data, error } = await supabaseAdmin.storage
    .from("dating-photos")
    .list(prefix, { limit: 100 });
  if (error) {
    console.error("[datingOrders] storage list failed", { error: error.message, prefix });
    return [];
  }
  return (data ?? [])
    .filter((f) => f.name.startsWith("source-"))
    .map((f) => `${prefix}/${f.name}`);
}

// Re-derives photo_paths/photos_count from storage and persists them.
export async function syncOrderPhotos(orderId: string, sessionId: string): Promise<string[]> {
  const paths = await listOrderPhotoPaths(sessionId);
  const { error } = await supabaseAdmin
    .from("dating_orders")
    .update({ photo_paths: paths, photos_count: paths.length })
    .eq("id", orderId);
  if (error) {
    console.error("[datingOrders] photo sync failed", { error: error.message, orderId });
  }
  return paths;
}

// Returns the order row, creating it from the paid Stripe session if the
// webhook hasn't landed yet. Null if the session isn't a paid dating order.
export async function getOrCreateDatingOrder(sessionId: string): Promise<DatingOrder | null> {
  const { data: existing } = await supabaseAdmin
    .from("dating_orders")
    .select(ORDER_COLUMNS)
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (existing) return existing as DatingOrder;

  const stripe = getStripeServerClient();
  if (!stripe) return null;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
  if (session.payment_status !== "paid" || session.metadata?.funnel !== "dating") return null;

  const email = session.customer_details?.email;
  if (!email) return null;
  const firstName = session.customer_details?.name?.trim().split(" ")[0] ?? null;

  const { data: created, error } = await supabaseAdmin
    .from("dating_orders")
    .upsert(
      {
        stripe_session_id: sessionId,
        email: email.toLowerCase(),
        first_name: firstName,
        amount_cents: typeof session.amount_total === "number" ? session.amount_total : 3900,
        utm_source: session.metadata?.utm_source ?? null,
        utm_campaign: session.metadata?.utm_campaign ?? null,
        utm_content: session.metadata?.utm_content ?? null,
      },
      { onConflict: "stripe_session_id" }
    )
    .select(ORDER_COLUMNS)
    .single();

  if (error) {
    console.error("[datingOrders] upsert failed", { error: error.message, sessionId });
    return null;
  }
  return created as DatingOrder;
}
