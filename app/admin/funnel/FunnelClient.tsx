"use client";

type FunnelRow = {
  key: string;
  label: string;
  n: number;
  source: string;
  reliable: boolean;
};

type Conversion = { email: string; name: string; date: string };

type Props = {
  rows: FunnelRow[];
  conversions: Conversion[];
  since: string;
  totalSessions: number;
};

export default function FunnelClient({ rows, conversions, since, totalSessions }: Props) {
  const top = rows[0]?.n ?? 1;

  return (
    <main className="min-h-screen bg-ash px-6 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute mb-1">
            Admin · Funnel
          </p>
          <h1 className="font-display text-2xl font-semibold text-void">
            Déperdition funnel
          </h1>
          <p className="text-sm text-dim mt-1">
            Depuis le {since} · {totalSessions} sessions quiz · identité : <code className="bg-wire px-1 rounded text-xs">funnel_sid</code>
          </p>
        </div>

        {/* Funnel table */}
        <div className="rounded-xl border border-wire bg-white overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-wire bg-ash">
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">Étape</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">N</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">% début</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">Drop</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const prev = i > 0 ? rows[i - 1].n : row.n;
                const pctTop = top > 0 ? Math.round(row.n / top * 100) : 0;
                const drop = prev > 0 && i > 0 ? Math.round((1 - row.n / prev) * 100) : 0;
                const isGap = i > 0 && rows[i - 1].key === "quiz_yes_ladders" && row.key === "optin";

                return (
                  <>
                    {isGap && (
                      <tr key="sep" className="border-t-2 border-ink/10">
                        <td colSpan={5} className="px-5 py-1.5 text-[10px] text-mute bg-ash/60 uppercase tracking-[0.1em] font-semibold">
                          Post-quiz
                        </td>
                      </tr>
                    )}
                    <tr key={row.key} className="border-b border-wire/60 last:border-0 hover:bg-ash/40 transition">
                      <td className="px-5 py-3.5 font-medium text-void">{row.label}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-void tabular-nums">
                        {row.n > 0 ? row.n : <span className="text-mute">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        {row.n > 0 ? (
                          <span className="text-dim">{pctTop}%</span>
                        ) : (
                          <span className="text-mute text-xs">en attente</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        {i > 0 && drop > 0 ? (
                          <span className={`font-semibold ${drop >= 50 ? "text-red-500" : drop >= 25 ? "text-amber-500" : "text-dim"}`}>
                            -{drop}%
                          </span>
                        ) : (
                          <span className="text-mute">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {/* Bar */}
                        <div className="h-1.5 bg-wire rounded-full w-24 overflow-hidden">
                          <div
                            className="h-full bg-void rounded-full transition-all"
                            style={{ width: `${pctTop}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Conversions */}
        {conversions.length > 0 && (
          <div className="rounded-xl border border-wire bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-wire bg-ash">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">
                Clients convertis depuis le funnel
              </p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {conversions.map(c => (
                  <tr key={c.email} className="border-b border-wire/60 last:border-0">
                    <td className="px-5 py-3 font-medium text-void">{c.name}</td>
                    <td className="px-5 py-3 text-dim">{c.email}</td>
                    <td className="px-5 py-3 text-right text-mute text-xs">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Data legend */}
        <div className="mt-6 text-xs text-mute space-y-1">
          <p className="font-semibold uppercase tracking-[0.1em] mb-2">Sources de données</p>
          <p>Quiz (Q6–Q11) → <code>funnel_sessions._max_step</code> — rétroactif depuis le 12/06</p>
          <p>Optin email → <code>leads.payload.funnel_sid</code> — rétroactif depuis le 12/06</p>
          <p>Rapport vu / CTA / Offer → <code>event_sessions</code> — données depuis ce déploiement</p>
          <p>Achats → <code>users.has_paid</code> croisé avec <code>leads.email</code></p>
        </div>

      </div>
    </main>
  );
}
