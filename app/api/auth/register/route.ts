import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { supabaseAdmin } from "../../../../lib/supabase";
import {
  createSession,
  consumeRegistrationToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../../../../lib/auth";
import { addToLeadsList, promoteLeadToCustomer } from "../../../../lib/klaviyo";
import { sendMetaEvent } from "../../../../lib/metaCapi";

export const runtime = "nodejs";

type Body = {
  email?: string;
  first_name?: string;
  registration_token?: string;
  funnel_sid?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;

  const email = (body.email ?? "").trim().toLowerCase();
  const firstName = (body.first_name ?? "").trim();
  const registrationToken = body.registration_token ?? "";
  const funnelSid = (body.funnel_sid ?? "").trim() || null;

  // ── Validation ──────────────────────────────
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  if (!firstName || firstName.length < 1) {
    return NextResponse.json({ error: "First name is required." }, { status: 400 });
  }

  // ── Check for existing account ───────────────
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  // ── Resolve has_paid + stripe_customer_id ────
  let hasPaid = false;
  let stripeCustomerId: string | null = null;

  // Paid access is granted ONLY via a single-use registration token that was
  // emailed to the proven owner of this address after purchase (Path A).
  //
  // SECURITY: we deliberately do NOT grant paid access by matching the typed
  // email against a Stripe customer with a successful charge. That "Path B"
  // let anyone who knew a paying customer's email create an account over it —
  // taking over their PII (questionnaire, photos, messages) and locking the
  // real customer out. A historical customer without a token must recover
  // access via the emailed link / magic link, which proves email ownership.
  if (registrationToken) {
    const tokenData = await consumeRegistrationToken(registrationToken);
    if (tokenData && tokenData.email === email) {
      hasPaid = true;
      stripeCustomerId = tokenData.stripeCustomerId;
    }
  }

  // ── Create user ──────────────────────────────
  const { data: user, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({
      email,
      first_name: firstName,
      stripe_customer_id: stripeCustomerId,
      has_paid: hasPaid,
      paid_at: hasPaid ? new Date().toISOString() : null,
      protocol_status: "not_started",
      funnel_sid: funnelSid,
    })
    .select("id, email, first_name, has_paid, protocol_status")
    .single();

  if (insertError || !user) {
    console.error("[register] User insert failed", { error: insertError?.message, email });
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }

  // ── Create session ───────────────────────────
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent") ?? undefined;

  let sessionToken: string;
  try {
    sessionToken = await createSession(user.id, ip, userAgent);
  } catch (err) {
    console.error("[register] Session creation failed", { error: String(err), userId: user.id });
    return NextResponse.json(
      { error: "Account created but session failed. Please log in." },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      has_paid: user.has_paid,
      protocol_status: user.protocol_status,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);
  response.cookies.set("prtcl_uid", user.id, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  const referer = request.headers.get("referer") ?? undefined;
  const createdAt = new Date().toISOString();

  // Run side-effects after response is sent, guaranteed to complete on serverless
  waitUntil((async () => {
    if (hasPaid) {
      await promoteLeadToCustomer(email, firstName).catch((err) =>
        console.error("[register] Klaviyo promote failed", { error: String(err), email })
      );
    } else {
      await addToLeadsList(email, firstName).catch((err) =>
        console.error("[register] Klaviyo leads failed", { error: String(err), email })
      );
    }

    // Meta CAPI Lead event
    await sendMetaEvent({
      eventName: "Lead",
      eventTime: Math.floor(new Date(createdAt).getTime() / 1000),
      eventId: `register:${email}:${createdAt}`,
      actionSource: "website",
      eventSourceUrl: referer,
      userAgent,
      ipAddress: ip,
      email,
    }).catch((err) =>
      console.error("[register] Meta Lead event failed", { error: String(err), email })
    );
  })());

  return response;
}
