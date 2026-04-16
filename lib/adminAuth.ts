import "server-only";
import { cookies } from "next/headers";
import { validateSession, SESSION_COOKIE_NAME, type AuthUser } from "./auth";

/**
 * Returns the authenticated admin user, or null if the request is not from
 * a logged-in admin. Use in every admin API route and the admin layout.
 */
export async function requireAdmin(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const user = await validateSession(token);
  if (!user || !user.is_admin) return null;

  return user;
}
