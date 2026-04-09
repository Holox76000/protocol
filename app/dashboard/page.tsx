import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession, SESSION_COOKIE_NAME } from "../../lib/auth";
import DashboardPage from "./DashboardPage";

export const runtime = "nodejs";

export default async function Dashboard() {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) redirect("/login?next=/dashboard");

  const user = await validateSession(sessionToken);
  if (!user) redirect("/login?next=/dashboard");

  return <DashboardPage user={user} />;
}
