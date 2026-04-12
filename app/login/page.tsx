import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateSession, SESSION_COOKIE_NAME } from "../../lib/auth";
import LoginPage from "./LoginPage";

export const runtime = "nodejs";

export default async function Login({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  // Already logged in → redirect to dashboard
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    const user = await validateSession(sessionToken);
    if (user) redirect("/dashboard");
  }

  const params = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | undefined>;
  const next = params.next ?? "/dashboard";
  const error = params.error;

  return <LoginPage next={next} error={error} />;
}
