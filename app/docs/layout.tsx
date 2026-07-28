import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/adminAuth";
import { getDocNav } from "../../lib/docs";
import DocsNav from "./DocsNav";

// The handbook documents internal revenue mechanics, growth tactics and known
// issues — admin-only, and never indexed. Reading cookies here makes the whole
// /docs subtree dynamic, so the markdown files are read at request time (see
// outputFileTracingIncludes in next.config.js).
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Protocol — Company Handbook",
  description: "Documentation interne : comment la boîte fonctionne.",
  robots: { index: false, follow: false },
};

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login?next=/docs");

  const groups = getDocNav().map((g) => ({
    category: g.category,
    docs: g.docs.map((d) => ({ slug: d.slug, title: d.title })),
  }));

  return (
    <div className="min-h-screen bg-pebble text-ink font-body">
      <div className="md:flex">
        <DocsNav groups={groups} />
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-3xl px-5 md:px-10 py-8 md:py-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
