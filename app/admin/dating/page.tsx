import Link from "next/link";
import { requireAdmin } from "../../../lib/adminAuth";
import { supabaseAdmin } from "../../../lib/supabase";

export const runtime = "nodejs";

type DatingOrderRow = {
  id: string;
  stripe_session_id: string;
  email: string;
  first_name: string | null;
  status: string;
  photos_count: number;
  amount_cents: number | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  created_at: string;
  photos_uploaded_at: string | null;
  delivered_at: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  paid:              "bg-amber-50 text-amber-700",
  photos_uploaded:   "bg-violet-50 text-violet-700",
  delivered:         "bg-emerald-50 text-emerald-700",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export default async function AdminDatingPage() {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("dating_orders")
    .select("id, stripe_session_id, email, first_name, status, photos_count, amount_cents, utm_source, utm_campaign, utm_content, created_at, photos_uploaded_at, delivered_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const orders = (data ?? []) as DatingOrderRow[];

  const counts = {
    total: orders.length,
    paid: orders.filter(o => o.status === "paid").length,
    uploaded: orders.filter(o => o.status === "photos_uploaded").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  return (
    <main className="min-h-screen bg-ash px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Admin · Dating</p>
            <h1 className="mt-1 font-display text-3xl text-void">Dating orders</h1>
            <p className="mt-1 text-[13px] text-dim">
              {counts.total} order{counts.total !== 1 ? "s" : ""} · {counts.paid} paid · {counts.uploaded} uploaded · {counts.delivered} delivered
            </p>
          </div>
          <div className="mt-1 flex items-center gap-5">
            <Link href="/admin" className="text-[12px] font-semibold text-mute hover:text-void transition-colors">
              ← Orders
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            Failed to load: {error.message}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-pebble bg-white">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-pebble bg-ash/60 text-[11px] uppercase tracking-wider text-mute">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Photos</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Uploaded</th>
                <th className="px-4 py-3 font-semibold">Attribution</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const price = o.amount_cents ? `$${(o.amount_cents / 100).toFixed(0)}` : "—";
                const badgeCls = STATUS_STYLES[o.status] ?? "bg-pebble text-dim";
                const utm = [o.utm_source, o.utm_campaign].filter(Boolean).join(" · ") || "—";
                return (
                  <tr key={o.id} className="border-b border-pebble/60 last:border-0 hover:bg-ash/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-void">{o.first_name ?? "—"}</div>
                      <div className="text-[12px] text-mute">{o.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeCls}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-void">
                      {o.photos_count} <span className="text-mute">· {price}</span>
                    </td>
                    <td className="px-4 py-3 text-mute">{fmtDate(o.created_at)}</td>
                    <td className="px-4 py-3 text-mute">{fmtTime(o.photos_uploaded_at)}</td>
                    <td className="px-4 py-3 text-[12px] text-mute">{utm}</td>
                    <td className="px-4 py-3 text-right">
                      {o.photos_count > 0 ? (
                        <Link
                          href={`/admin/dating/${encodeURIComponent(o.stripe_session_id)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-pebble bg-white px-3 py-1.5 text-[12px] font-semibold text-void hover:bg-ash transition-colors"
                        >
                          View photos →
                        </Link>
                      ) : (
                        <span className="text-[12px] text-mute">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-mute">
                    No dating orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
