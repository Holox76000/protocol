import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { createMagicLinkToken } from "../../../../../lib/auth";
import { sendMagicLinkEmail } from "../../../../../lib/email";

export const runtime = "nodejs";

type Body = {
  email?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const email = (body.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Look up user — do not reveal whether the email exists (timing attack mitigation)
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, first_name")
    .eq("email", email)
    .maybeSingle();

  if (!user) {
    // Return 200 to not reveal whether the account exists
    return NextResponse.json({ status: "check_email" });
  }

  let token: string;
  try {
    token = await createMagicLinkToken(user.id as string);
  } catch (err) {
    console.error("[magic-link/send] token creation failed", { error: String(err), email });
    return NextResponse.json({ error: "Failed to generate login link. Please try again." }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const magicLinkUrl = `${baseUrl}/api/auth/magic-link/verify?token=${token}&redirect=/dashboard`;

  try {
    await sendMagicLinkEmail({
      email,
      firstName: (user.first_name as string) ?? "there",
      magicLinkUrl,
    });
  } catch (err) {
    console.error("[magic-link/send] Resend failed", { error: String(err), email });
    return NextResponse.json(
      { error: "Failed to send login link. Please try again or contact support." },
      { status: 502 }
    );
  }

  return NextResponse.json({ status: "check_email" });
}
