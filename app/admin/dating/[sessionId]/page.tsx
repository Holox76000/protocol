import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import { listOrderPhotoPaths } from "../../../../lib/datingOrders";
import DownloadAllButton from "./DownloadAllButton";

export const runtime = "nodejs";

// 1h signed URL — enough to browse the order + download without expiring mid-session.
const SIGNED_URL_TTL_SEC = 3600;

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export default async function AdminDatingOrderPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await requireAdmin();

  const { sessionId: rawSessionId } = await params;
  const sessionId = decodeURIComponent(rawSessionId);

  const { data: order } = await supabaseAdmin
    .from("dating_orders")
    .select("id, stripe_session_id, email, first_name, status, photos_count, amount_cents, utm_source, utm_campaign, utm_content, created_at, photos_uploaded_at, delivered_at")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (!order) notFound();

  // Storage listing is the source of truth; the jsonb column can lag.
  const paths = await listOrderPhotoPaths(sessionId);

  // Batch-sign all photos server-side so the UI renders with immediate previews
  // and download links, no client round-trip.
  const photos: { path: string; signedUrl: string; filename: string }[] = [];
  if (paths.length > 0) {
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("dating-photos")
      .createSignedUrls(paths, SIGNED_URL_TTL_SEC);
    if (signErr) {
      console.error("[admin/dating] createSignedUrls failed", { error: signErr.message, sessionId });
    }
    for (const s of signed ?? []) {
      if (!s.signedUrl || !s.path) continue;
      photos.push({
        path: s.path,
        signedUrl: s.signedUrl,
        filename: s.path.split("/").pop() ?? "photo",
      });
    }
  }

  const price = order.amount_cents ? `$${((order.amount_cents as number) / 100).toFixed(2)}` : "—";
  const utm = [order.utm_source, order.utm_campaign, order.utm_content].filter(Boolean).join(" · ") || "—";

  return (
    <main className="min-h-screen bg-ash px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/admin/dating" className="text-[12px] font-semibold text-mute hover:text-void transition-colors">
            ← All dating orders
          </Link>
        </div>

        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Dating order</p>
            <h1 className="mt-1 font-display text-3xl text-void">{order.first_name ?? "—"}</h1>
            <p className="mt-1 truncate text-[13px] text-dim">{order.email}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[12px] uppercase tracking-wider text-mute">{order.status}</div>
            <div className="mt-1 font-mono text-[13px] text-void">{price}</div>
            <div className="mt-1 text-[11px] text-mute">Paid {fmtTime(order.created_at as string)}</div>
            {order.photos_uploaded_at && (
              <div className="text-[11px] text-mute">Uploaded {fmtTime(order.photos_uploaded_at as string)}</div>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-[13px] text-mute">
            {photos.length} photo{photos.length !== 1 ? "s" : ""} · Attribution: {utm} · Signed URLs expire in 1 h
          </div>
          {photos.length > 0 && (
            <DownloadAllButton photos={photos} orderLabel={`${order.first_name ?? "order"}-${sessionId.slice(-8)}`} />
          )}
        </div>

        {photos.length === 0 ? (
          <div className="rounded-2xl border border-pebble bg-white px-6 py-16 text-center">
            <p className="text-[14px] text-mute">
              No photos uploaded yet for this order.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map(p => (
              <a
                key={p.path}
                href={p.signedUrl}
                download={p.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-xl border border-pebble bg-white transition-shadow hover:shadow-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.signedUrl}
                  alt={p.filename}
                  className="aspect-[3/4] w-full object-cover"
                  loading="lazy"
                />
                <div className="flex items-center justify-between px-3 py-2 text-[11px]">
                  <span className="truncate font-mono text-mute">{p.filename}</span>
                  <span className="shrink-0 font-semibold text-void opacity-0 transition-opacity group-hover:opacity-100">
                    Download →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
