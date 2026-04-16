import { requireAdmin } from "../../lib/adminAuth";
import { supabaseAdmin } from "../../lib/supabase";
import OrderListClient from "./OrderListClient";

export const runtime = "nodejs";

export default async function AdminPage() {
  await requireAdmin(); // layout already guards, belt-and-suspenders

  const { data } = await supabaseAdmin
    .from("users")
    .select(`
      id, email, first_name, protocol_status, created_at,
      questionnaire_responses(submitted_at)
    `)
    .eq("has_paid", true)
    .order("created_at", { ascending: false });

  const orders = (data ?? []).map((u) => {
    const qr = Array.isArray(u.questionnaire_responses)
      ? u.questionnaire_responses[0]
      : u.questionnaire_responses;
    return {
      id: u.id as string,
      email: u.email as string,
      first_name: u.first_name as string,
      protocol_status: u.protocol_status as string,
      created_at: u.created_at as string,
      submitted_at: (qr as { submitted_at?: string } | null)?.submitted_at ?? null,
    };
  });

  return (
    <main className="min-h-screen bg-ash px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Admin</p>
          <h1 className="mt-1 font-display text-3xl text-void">Orders</h1>
          <p className="mt-1 text-[13px] text-dim">
            {orders.length} paid client{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <OrderListClient orders={orders} />
      </div>
    </main>
  );
}
