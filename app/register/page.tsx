import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateSession, peekRegistrationToken, SESSION_COOKIE_NAME } from "../../lib/auth";
import RegisterPage from "./RegisterPage";

export const runtime = "nodejs";

export default async function Register({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  // If already logged in, go to dashboard
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    const user = await validateSession(sessionToken);
    if (user) redirect("/dashboard");
  }

  // Peek at registration token to pre-fill form (without consuming it)
  const rawToken = searchParams?.token ?? "";
  let prefillEmail = searchParams?.email ?? "";
  let prefillFirstName = searchParams?.firstName ?? "";

  if (rawToken) {
    const tokenData = await peekRegistrationToken(rawToken).catch(() => null);
    if (tokenData) {
      prefillEmail = tokenData.email;
      prefillFirstName = tokenData.firstName ?? "";
    }
  }

  return (
    <RegisterPage
      registrationToken={rawToken}
      prefillEmail={prefillEmail}
      prefillFirstName={prefillFirstName}
    />
  );
}
