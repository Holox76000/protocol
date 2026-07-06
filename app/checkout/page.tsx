import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { validateSession, SESSION_COOKIE_NAME } from "../../lib/auth";
import { supabaseAdmin } from "../../lib/supabase";

const CheckoutPage = dynamic(
  () => import("./CheckoutPage").then((m) => ({ default: m.CheckoutPage })),
  { ssr: false }
);

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Checkout | Protocol",
};

export default async function CheckoutRoute({
  searchParams,
}: {
  searchParams?: { funnel_sid?: string };
}) {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  const user = sessionToken ? await validateSession(sessionToken) : null;

  if (user) {
    if (user.has_paid) redirect("/dashboard");
    return <CheckoutPage email={user.email} />;
  }

  // Payment-first guest flow: buyers purchase in minutes at the report's
  // emotional peak — no account wall before payment. The funnel session is
  // the identity; the Stripe webhook creates the account after purchase
  // (registration token + welcome email, same path as external payments).
  const funnelSid = searchParams?.funnel_sid?.trim();
  if (funnelSid) {
    const { data: sess } = await supabaseAdmin
      .from("funnel_sessions")
      .select("answers")
      .eq("session_id", funnelSid)
      .maybeSingle();
    const email = String((sess?.answers as Record<string, unknown> | null)?.email ?? "")
      .trim()
      .toLowerCase();

    if (email) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id, has_paid")
        .eq("email", email)
        .maybeSingle();
      if (existing?.has_paid) redirect("/login?next=/dashboard");

      return <CheckoutPage email={email} guest />;
    }
  }

  redirect("/login?next=/checkout");
}
