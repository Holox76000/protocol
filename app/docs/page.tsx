import Link from "next/link";
import { getDocNav } from "../../lib/docs";

export default function DocsHome() {
  const groups = getDocNav();

  return (
    <div>
      <div className="mb-10">
        <div className="text-[11px] uppercase tracking-widest text-mute mb-2">
          Company Handbook
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink tracking-tight mb-4">
          Comment Protocol fonctionne
        </h1>
        <p className="text-[15px] leading-7 text-ink/80 max-w-2xl">
          Le manuel interne de la boîte : ce qu'on vend, comment la machine
          tourne, et comment on opère avec l'IA au centre. Écrit à partir du
          code réel du repo — quand le produit change, cette doc change avec
          lui. Commence par les <em>Fondations</em>, puis pioche selon ton rôle.
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dim mb-3">
              {group.category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.docs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/docs/${doc.slug}`}
                  className="group rounded-xl border border-wire bg-white p-4 transition-colors hover:border-void/40"
                >
                  <div className="font-display font-semibold text-ink group-hover:text-void">
                    {doc.title}
                  </div>
                  {doc.summary && (
                    <div className="mt-1 text-[13.5px] leading-6 text-dim">
                      {doc.summary}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="text-dim">
          Aucun document pour l'instant. Ajoute un fichier{" "}
          <code className="rounded bg-pebble border border-wire px-1.5 py-0.5 text-[13px]">
            docs/NN-slug.md
          </code>{" "}
          pour le voir apparaître ici.
        </p>
      )}
    </div>
  );
}
