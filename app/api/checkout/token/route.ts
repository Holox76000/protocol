import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getStripeServerClient } from "../../../../lib/stripe";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

/**
 * GET /api/checkout/token?session_id=cs_xxx
 *
 * Called by the success page to retrieve customer info once the Stripe
 * webhook has processed the payment. Polls until the registration_token row
 * exists (meaning the webhook has fired), then returns email + firstName so
 * the success page can redirect to /register?email=...&firstName=...
 *
 * Returns:
 *   { email, firstName } — ready, redirect to /register
 *   { pending: true }   — webhook hasn't fired yet, poll again
 *   { error }           — something went wrong
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const stripe = getStripeServerClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  // Get customer email from Stripe
  let email: string | null = null;
  let firstName: string | null = null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    email = session.customer_details?.email ?? null;
    const fullName = session.customer_details?.name ?? null;
    if (fullName) firstName = fullName.trim().split(" ")[0];
  } catch (err) {
    console.error("[checkout/token] Stripe session retrieve failed", { sessionId, error: String(err) });
    return NextResponse.json({ error: "Could not retrieve Stripe session" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ pending: true });
  }

  // Check if the webhook has fired by looking for the registration token row
  const { data } = await supabaseAdmin
    .from("registration_tokens")
    .select("first_name")
    .eq("email", email.toLowerCase())
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Also check if user already registered (existing user path in webhook)
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id, first_name")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!data && !existingUser) {
    // Webhook hasn't fired yet
    return NextResponse.json({ pending: true });
  }

  const resolvedFirstName = data?.first_name ?? existingUser?.first_name ?? firstName ?? null;

  return NextResponse.json({ email, firstName: resolvedFirstName });
}
