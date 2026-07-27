import Link from "next/link";
import { requireAdmin } from "../../../../lib/adminAuth";
import { loadAllTemplates } from "../../../../lib/datingTemplates";
import { supabaseAdmin } from "../../../../lib/supabase";
import TemplatesClient from "./TemplatesClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SEC = 3600;

export default async function AdminDatingTemplatesPage() {
  await requireAdmin();

  const templates = await loadAllTemplates();

  // Sign every ref image so the list can preview them without exposing the
  // bucket publicly. 1 h is plenty for an admin session.
  const paths = templates.map(t => t.refImagePath);
  const signed = paths.length
    ? await supabaseAdmin.storage.from("dating-photos").createSignedUrls(paths, SIGNED_URL_TTL_SEC)
    : { data: [] as { path: string | null; signedUrl: string | null }[] };
  const signedByPath = new Map<string, string>();
  for (const s of signed.data ?? []) {
    if (s.path && s.signedUrl) signedByPath.set(s.path, s.signedUrl);
  }

  const templatesForClient = templates.map(t => ({
    id: t.id,
    slug: t.slug,
    label: t.label,
    prompt: t.prompt,
    refImagePath: t.refImagePath,
    active: t.active,
    sortOrder: t.sortOrder,
    createdAt: t.createdAt,
    signedUrl: signedByPath.get(t.refImagePath) ?? null,
  }));

  return (
    <main className="min-h-screen bg-ash px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Admin · Dating</p>
            <h1 className="mt-1 font-display text-3xl text-void">Templates</h1>
            <p className="mt-1 text-[13px] text-dim">
              {templates.length} template{templates.length !== 1 ? "s" : ""} · {templates.filter(t => t.active).length} active
            </p>
          </div>
          <div className="mt-1 flex items-center gap-5">
            <Link href="/admin/dating" className="text-[12px] font-semibold text-mute hover:text-void transition-colors">
              ← Orders
            </Link>
          </div>
        </div>

        <TemplatesClient initial={templatesForClient} />
      </div>
    </main>
  );
}
