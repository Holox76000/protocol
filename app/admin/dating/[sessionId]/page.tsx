import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import { listOrderPhotoPaths, orderPhotosPrefix } from "../../../../lib/datingOrders";
import { DATING_QUESTIONS } from "../../../../lib/datingQuestionnaire";
import DownloadAllButton from "./DownloadAllButton";
import OrderActions from "./OrderActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SEC = 3600;

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

type Photo = { path: string; signedUrl: string; filename: string };

async function signBatch(paths: string[]): Promise<Photo[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabaseAdmin.storage
    .from("dating-photos")
    .createSignedUrls(paths, SIGNED_URL_TTL_SEC);
  if (error) {
    console.error("[admin/dating] createSignedUrls failed", { error: error.message });
    return [];
  }
  return (data ?? [])
    .filter((s): s is { path: string; signedUrl: string; error: null } => !!s.path && !!s.signedUrl)
    .map((s) => ({
      path: s.path,
      signedUrl: s.signedUrl,
      filename: s.path.split("/").pop() ?? "photo",
    }));
}

export default async function AdminDatingOrderPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await requireAdmin();

  const { sessionId: rawSessionId } = await params;
  const sessionId = decodeURIComponent(rawSessionId);

  const { data: order } = await supabaseAdmin
    .from("dating_orders")
    .select("id, stripe_session_id, email, first_name, status, photos_count, output_count, output_paths, generation_cost_cents, amount_cents, utm_source, utm_campaign, utm_content, created_at, photos_uploaded_at, generated_at, deliver_at, delivered_at, questionnaire_answers")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (!order) notFound();

  // Source photos (customer uploads) — storage listing is the source of truth.
  const sourcePaths = await listOrderPhotoPaths(sessionId);
  const sourcePhotos = await signBatch(sourcePaths);

  // Output photos (generated) — DB output_paths is authoritative once
  // generation ran. Fall back to a storage listing of the output/ prefix
  // if the column happens to be empty but files exist.
  let outputPaths = (order.output_paths as string[] | null) ?? [];
  if (outputPaths.length === 0) {
    const { data: outputListing } = await supabaseAdmin.storage
      .from("dating-photos")
      .list(`${orderPhotosPrefix(sessionId)}/output`, { limit: 100 });
    outputPaths = (outputListing ?? [])
      .filter((f) => !f.name.startsWith(".")) // skip .emptyFolderPlaceholder etc.
      .map((f) => `${orderPhotosPrefix(sessionId)}/output/${f.name}`);
  }
  const outputPhotos = await signBatch(outputPaths);

  const price = order.amount_cents ? `$${((order.amount_cents as number) / 100).toFixed(2)}` : "—";
  const genCost = order.generation_cost_cents ? `$${((order.generation_cost_cents as number) / 100).toFixed(2)}` : null;
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
            <div className="mt-1 font-mono text-[13px] text-void">
              {price}
              {genCost && <span className="ml-2 text-mute">· gen {genCost}</span>}
            </div>
            <div className="mt-1 text-[11px] text-mute">Paid {fmtTime(order.created_at as string)}</div>
            {order.photos_uploaded_at && (
              <div className="text-[11px] text-mute">Uploaded {fmtTime(order.photos_uploaded_at as string)}</div>
            )}
            {order.generated_at && (
              <div className="text-[11px] text-mute">Generated {fmtTime(order.generated_at as string)}</div>
            )}
            {order.delivered_at && (
              <div className="text-[11px] text-mute">Delivered {fmtTime(order.delivered_at as string)}</div>
            )}
          </div>
        </div>

        {/* Manual delivery actions */}
        <div className="mb-6">
          <OrderActions
            sessionId={sessionId}
            status={order.status as string}
            outputCount={(order.output_count as number) ?? outputPhotos.length}
            deliverAt={(order.deliver_at as string | null) ?? null}
          />
        </div>

        {/* Questionnaire */}
        {(() => {
          const answers = (order.questionnaire_answers as Record<string, string> | null) ?? null;
          const answered = answers ? Object.keys(answers).length : 0;
          return (
            <div className="mb-6 rounded-2xl border border-pebble bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Questionnaire</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${answered === DATING_QUESTIONS.length ? "bg-emerald-50 text-emerald-700" : answered > 0 ? "bg-amber-50 text-amber-700" : "bg-pebble text-dim"}`}>
                  {answered}/{DATING_QUESTIONS.length}
                </span>
              </div>
              {answered === 0 ? (
                <p className="text-[13px] text-mute">Not answered yet.</p>
              ) : (
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {DATING_QUESTIONS.map((q) => (
                    <div key={q.id}>
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-mute">{q.q}</dt>
                      <dd className="mt-1 text-[13px] text-void">{answers?.[q.id] ?? <span className="text-dim">—</span>}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          );
        })()}

        {/* Generated photos (preview before delivery) */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Generated photos (preview)</p>
              <p className="mt-1 text-[13px] text-mute">
                {outputPhotos.length > 0
                  ? `${outputPhotos.length} generated · click to download individually · signed URLs expire in 1 h`
                  : "No generated photos yet — click ▶ Generate now above to run Nano Banana."}
              </p>
            </div>
            {outputPhotos.length > 0 && (
              <DownloadAllButton photos={outputPhotos} orderLabel={`${order.first_name ?? "order"}-${sessionId.slice(-8)}-output`} />
            )}
          </div>

          {outputPhotos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-pebble bg-white px-6 py-16 text-center">
              <p className="text-[14px] text-mute">Nothing generated yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {outputPhotos.map((p) => (
                <a
                  key={p.path}
                  href={p.signedUrl}
                  download={p.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-xl border border-pebble bg-white transition-shadow hover:shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.signedUrl} alt={p.filename} className="aspect-[4/5] w-full object-cover" loading="lazy" />
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

        {/* Source photos (customer uploads) */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Source selfies (customer upload)</p>
              <p className="mt-1 text-[13px] text-mute">
                {sourcePhotos.length} selfie{sourcePhotos.length !== 1 ? "s" : ""} · Attribution: {utm}
              </p>
            </div>
            {sourcePhotos.length > 0 && (
              <DownloadAllButton photos={sourcePhotos} orderLabel={`${order.first_name ?? "order"}-${sessionId.slice(-8)}-source`} />
            )}
          </div>

          {sourcePhotos.length === 0 ? (
            <div className="rounded-2xl border border-pebble bg-white px-6 py-16 text-center">
              <p className="text-[14px] text-mute">No source photos uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {sourcePhotos.map((p) => (
                <a
                  key={p.path}
                  href={p.signedUrl}
                  download={p.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-xl border border-pebble bg-white transition-shadow hover:shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.signedUrl} alt={p.filename} className="aspect-[3/4] w-full object-cover" loading="lazy" />
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
      </div>
    </main>
  );
}
