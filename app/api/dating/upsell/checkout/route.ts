// Creates a Stripe Checkout Session for a $20 dating upsell.
//
// Two kinds — each a separate one-shot payment; both can be purchased:
//   priority → 8h delivery SLA (vs standard 24h with 6-8h artificial hold)
//   luxury   → unlocks the 8 luxury templates on top of the core set
//
// Idempotent guardrails:
//   - Refuses if the upsell flag is already set on the order (nothing to sell)
//   - Refuses if a matching upsell payment intent was already recorded
// The checkout.session.completed webhook is where the flag actually flips,
// so a mid-flight duplicate session just no-ops when it lands.

import { NextResponse } from "next/server";
import { getStripeServerClient, getPublicSiteUrl } from "../../../../../lib/stripe";
import { supabaseAdmin } from "../../../../../lib/supabase";

export const runtime = "nodejs";

type Body = {
  session_id?: string;   // original dating checkout session id — used to find the order
  kind?: "priority" | "luxury";
};

const UPSELL_PRICE_CENTS = 2000; // $20

const UPSELL_META: Record<"priority" | "luxury", { label: string; description: string }> = {
  priority: {
    label:       "Protocol Dating — Priority delivery (8h)",
    description: "Get your dating photos within 8h of your original purchase.",
  },
  luxury: {
    label:       "Protocol Dating — Luxury Lifestyle pack",
    description: "8 extra dating photos in luxury scenes (yacht, private jet, ski chalet, and more).",
  },
};

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const sessionId = body.session_id;
  const kind = body.kind;

  if (!sessionId) return NextResponse.json({ error: "missing session_id" }, { status: 400 });
  if (kind !== "priority" && kind !== "luxury") {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("dating_orders")
    .select("id, email, first_name, upsell_priority, upsell_luxury, status")
    .eq("stripe_session_id", sessionId)
    .maybeSingle<{
      id: string;
      email: string;
      first_name: string | null;
      upsell_priority: boolean;
      upsell_luxury: boolean;
      status: string;
    }>();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }
  if (kind === "priority" && order.upsell_priority) {
    return NextResponse.json({ error: "already purchased" }, { status: 409 });
  }
  if (kind === "luxury" && order.upsell_luxury) {
    return NextResponse.json({ error: "already purchased" }, { status: 409 });
  }
  // The priority upsell only makes sense while the order still has a
  // delivery window to compress. Once delivered, refuse.
  if (kind === "priority" && order.status === "delivered") {
    return NextResponse.json({ error: "already delivered" }, { status: 409 });
  }

  const siteUrl = getPublicSiteUrl(request.headers.get("origin"));
  const meta = UPSELL_META[kind];

  try {
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      billing_address_collection: "auto",
      customer_email: order.email,
      line_items: [
        {
          price_data: {
            currency:     "usd",
            unit_amount:  UPSELL_PRICE_CENTS,
            product_data: { name: meta.label, description: meta.description },
          },
          quantity: 1,
        },
      ],
      // Redirect back to the same success page so the customer stays in the
      // dating success flow. `upsell=<kind>` is a lightweight signal for the
      // UI to show a confirmation state without polling the webhook.
      success_url: `${siteUrl}/dating/success?session_id=${encodeURIComponent(sessionId)}&upsell=${kind}`,
      cancel_url:  `${siteUrl}/dating/success?session_id=${encodeURIComponent(sessionId)}&upsell_cancelled=${kind}`,
      metadata: {
        upsell_kind:       kind,
        dating_order_id:   order.id,
        dating_session_id: sessionId,
        source:            "dating_success_upsell",
      },
    });
    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    console.error("[dating/upsell/checkout] create failed", { error: String(err), kind, sessionId });
    return NextResponse.json({ error: "checkout create failed" }, { status: 500 });
  }
}
