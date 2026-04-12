import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { validateSession, SESSION_COOKIE_NAME } from "../../lib/auth";

const CheckoutPage = dynamic(
  () => import("./CheckoutPage").then((m) => ({ default: m.CheckoutPage })),
  { ssr: false }
);

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

  return <CheckoutPage email={user.email} />;
}
