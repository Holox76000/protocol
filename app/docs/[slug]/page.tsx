import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllDocs, getDoc } from "../../../lib/docs";
import DocMarkdown from "../DocMarkdown";

export function generateStaticParams() {
  return getAllDocs().map((d) => ({ slug: d.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const doc = getDoc(params.slug);
  return {
    title: doc ? `${doc.title} — Protocol Handbook` : "Protocol Handbook",
    robots: { index: false, follow: false },
  };
}

export default function DocPage({ params }: { params: { slug: string } }) {
  const doc = getDoc(params.slug);
  if (!doc) notFound();

  const all = getAllDocs();
  const idx = all.findIndex((d) => d.slug === doc.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <article>
      <div className="text-[11px] uppercase tracking-widest text-mute mb-4">
        {doc.category}
      </div>

      <DocMarkdown content={doc.content} />

      <nav className="mt-16 flex items-stretch justify-between gap-4 border-t border-wire pt-6">
        {prev ? (
          <Link
            href={`/docs/${prev.slug}`}
            className="group flex-1 rounded-lg border border-wire bg-white px-4 py-3 hover:border-void/40"
          >
            <div className="text-[11px] uppercase tracking-wide text-mute">
              Précédent
            </div>
            <div className="font-medium text-ink group-hover:text-void">
              {prev.title}
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className="group flex-1 rounded-lg border border-wire bg-white px-4 py-3 text-right hover:border-void/40"
          >
            <div className="text-[11px] uppercase tracking-wide text-mute">
              Suivant
            </div>
            <div className="font-medium text-ink group-hover:text-void">
              {next.title}
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </nav>
    </article>
  );
}
