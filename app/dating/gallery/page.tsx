import type { Metadata } from "next";
import { supabaseAdmin } from "../../../lib/supabase";
import { isValidCheckoutSessionId } from "../../../lib/datingOrders";
import "../../f1/f1.css";
import "../../f1/offer/f1-offer.css";
import "../dating.css";

export const runtime = "nodejs";
// Signed URLs are per-request, so no static caching — force dynamic.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Protocol Dating photos",
  robots: { index: false, follow: false },
};

const SIGNED_URL_TTL_SEC = 3600; // 1h — plenty for a browse + download session

type OrderRow = {
  id: string;
  email: string;
  first_name: string | null;
  status: string;
  output_paths: string[];
  output_count: number;
  delivered_at: string | null;
  amount_cents: number | null;
};

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <main className="mo-page">
      <section className="mo-section" style={{ minHeight: "60vh" }}>
        <div className="mo-container">
          <div className="mo-section-head--center">
            <h1 className="mo-section-title">{title}</h1>
            <p className="dt-research-sub" style={{ marginTop: 20 }}>{body}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function DatingGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId || !isValidCheckoutSessionId(sessionId)) {
    return (
      <EmptyState
        title="Gallery link missing"
        body="Open the link from the email we sent you when your photos were ready."
      />
    );
  }

  const { data: order } = await supabaseAdmin
    .from("dating_orders")
    .select("id, email, first_name, status, output_paths, output_count, delivered_at, amount_cents, gallery_first_viewed_at")
    .eq("stripe_session_id", sessionId)
    .maybeSingle<OrderRow & { gallery_first_viewed_at: string | null }>();

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        body="Double-check the link, or reply to your confirmation email — we'll fix it."
      />
    );
  }

  // First-view stamp: powers the NPS cron (email fires 1h after this).
  // Fire-and-forget to avoid slowing the page render — writing this exact
  // field is idempotent (only overwrites null → now), so a lost update is
  // acceptable and a duplicate is a no-op.
  if (order.status === "delivered" && !order.gallery_first_viewed_at) {
    await supabaseAdmin
      .from("dating_orders")
      .update({ gallery_first_viewed_at: new Date().toISOString() })
      .eq("id", order.id)
      .is("gallery_first_viewed_at", null);
  }

  if (order.status !== "delivered") {
    // The generation cron is between 0-2 min behind fresh photos_uploaded orders.
    return (
      <EmptyState
        title="Your photos are being generated."
        body="This usually takes 5–15 minutes. We'll email you the moment they're ready — you can close this tab."
      />
    );
  }

  const paths = (order.output_paths ?? []).filter(Boolean);
  const signed = paths.length
    ? await supabaseAdmin.storage.from("dating-photos").createSignedUrls(paths, SIGNED_URL_TTL_SEC)
    : { data: [], error: null };

  const photos = (signed.data ?? [])
    .filter((s): s is { path: string; signedUrl: string; error: null } => !!s.signedUrl && !!s.path)
    .map((s) => ({
      path: s.path,
      signedUrl: s.signedUrl,
      filename: s.path.split("/").pop() ?? "photo.jpg",
      // Derive style from filename, e.g. "nature-forest-trail.jpg" → "nature".
      style: (s.path.split("/").pop()?.split("-")[0] ?? "photo"),
    }));

  return (
    <main className="mo-page">
      <section className="mo-section">
        <div className="mo-container">
          <div className="mo-section-head--center">
            <p className="mo-section-eyebrow mo-section-eyebrow--center">Your gallery</p>
            <h1 className="mo-section-title" style={{ marginTop: 12 }}>
              {order.first_name ?? "Your"} photos. <em>Ready to post.</em>
            </h1>
            <p className="dt-research-sub">
              {photos.length} photos across all styles. Tap any image to download at full resolution.
              Links stay live — bookmark this page.
            </p>
          </div>

          {photos.length === 0 ? (
            <p style={{ textAlign: "center", color: "#7f949b", marginTop: 32 }}>
              No photos available yet. Refresh in a minute.
            </p>
          ) : (
            <div className="dt-gallery-grid">
              {photos.map((p) => (
                <a
                  key={p.path}
                  href={p.signedUrl}
                  download={p.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dt-gallery-item"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.signedUrl} alt={p.filename} loading="lazy" />
                  <div className="dt-gallery-item__meta">
                    <span className="dt-gallery-item__style">{p.style}</span>
                    <span className="dt-gallery-item__dl">Download ↓</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
