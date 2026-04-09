import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateSession, SESSION_COOKIE_NAME } from "../../lib/auth";
import LoginPage from "./LoginPage";

export const runtime = "nodejs";

export default async function Login({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  // Already logged in → redirect to dashboard
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    const user = await validateSession(sessionToken);
    if (user) redirect("/dashboard");
  }

  const next = searchParams?.next ?? "/dashboard";

  return <LoginPage next={next} />;
}
