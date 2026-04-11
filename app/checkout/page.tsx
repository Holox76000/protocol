import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { validateSession, SESSION_COOKIE_NAME } from "../../lib/auth";
import { CheckoutPage } from "./CheckoutPage";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Checkout | Protocol",
};

export default async function CheckoutRoute() {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) redirect("/login?next=/checkout");

  const user = await validateSession(sessionToken);
  if (!user) redirect("/login?next=/checkout");

  if (user.has_paid) redirect("/dashboard");

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <CheckoutPage email={user.email} />
    </Suspense>
  );
}
