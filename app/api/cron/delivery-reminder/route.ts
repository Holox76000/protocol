import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { sendAdminDeliveryReminderEmail } from "../../../../lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

const HOURS_SINCE_PAYMENT = Number(process.env.DELIVERY_REMINDER_HOURS ?? 24);
const BATCH_LIMIT = 50;

type UserRow = {
  id: string;
  email: string;
  first_name: string | null;
  protocol_status: string | null;
  paid_at: string;
  rush_delivery: boolean | null;
};

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - HOURS_SINCE_PAYMENT * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, protocol_status, paid_at, rush_delivery")
    .eq("has_paid", true)
    .neq("protocol_status", "delivered")
    .is("admin_delivery_reminder_sent_at", null)
    .not("paid_at", "is", null)
    .lte("paid_at", cutoff)
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("[cron/delivery-reminder] query failed", { error: error.message });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const users = (data ?? []) as UserRow[];
  let sent = 0;
  let failed = 0;

  for (const user of users) {
    // Mark sent before the actual send so a transient error doesn't cause double-fires.
    await supabaseAdmin
      .from("users")
      .update({ admin_delivery_reminder_sent_at: now.toISOString() })
      .eq("id", user.id);

    const hoursSincePayment = (now.getTime() - new Date(user.paid_at).getTime()) / (60 * 60 * 1000);

    try {
      await sendAdminDeliveryReminderEmail({
        userId: user.id,
        email: user.email,
        firstName: user.first_name ?? undefined,
        paidAt: user.paid_at,
        protocolStatus: user.protocol_status ?? "unknown",
        rushDelivery: Boolean(user.rush_delivery),
        hoursSincePayment,
      });
      sent++;
    } catch (err) {
      failed++;
      console.error("[cron/delivery-reminder] send failed", { userId: user.id, error: String(err) });
    }
  }

  console.log("[cron/delivery-reminder] done", { sent, failed, candidates: users.length });
  return NextResponse.json({ ok: true, sent, failed, candidates: users.length });
}
