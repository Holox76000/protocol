import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendGA4Event } from "../../../lib/ga4";
import { extractGa4ClientId } from "../../../lib/ga4";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { eventName?: string; params?: Record<string, unknown>; pagePath?: string; pageTitle?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { eventName, params = {}, pagePath, pageTitle } = body;

  if (!eventName || typeof eventName !== "string") {
    return NextResponse.json({ error: "Missing eventName" }, { status: 400 });
  }

  // Extract the real GA4 client_id from the _ga cookie set by prior gtag sessions,
  // or fall back to generating one from a stable identifier.
  const cookieStore = await cookies();
  const gaCookie = cookieStore.get("_ga")?.value ?? null;
  const clientId = extractGa4ClientId(gaCookie) ?? generateClientId(request);

  const eventParams: Record<string, unknown> = { ...params };
  if (pagePath) eventParams.page_path = pagePath;
  if (pageTitle) eventParams.page_title = pageTitle;
  if (pagePath) eventParams.page_location = `https://protocol-club.com${pagePath}`;

  await sendGA4Event({ eventName, params: eventParams, clientId });

  return NextResponse.json({ ok: true });
}

/**
 * Generate a stable fallback client_id from the request IP + user-agent.
 * This is used only when no _ga cookie is present (first visit, blocked cookies).
 * Format matches GA4's client_id pattern: <int>.<int>
 */
function generateClientId(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = request.headers.get("user-agent") ?? "";
  const seed = `${ip}|${ua}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return `${Math.abs(hash)}.${Math.floor(Date.now() / 86_400_000)}`;
}
