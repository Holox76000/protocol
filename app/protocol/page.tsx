import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession, SESSION_COOKIE_NAME } from "../../lib/auth";

export const runtime = "nodejs";

export default async function ProtocolPage() {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) redirect("/login?next=/protocol");

  const user = await validateSession(sessionToken);
  if (!user) redirect("/login?next=/protocol");

  redirect(`/protocol/${user.email}`);
}
