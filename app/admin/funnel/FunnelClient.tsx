"use client";

import { useMemo, useState } from "react";

type Session = { sid: string; maxStep: number; date: string };
type Lead    = { email: string; funnelSid: string; date: string };
type Event   = { sid: string; event: string; funnelSid: string; date: string };
type User    = { email: string; name: string; date: string };

type Props = {
  sessions: Session[];
  leads:    Lead[];
  events:   Event[];
  users:    User[];
  since:    string;
};

type Preset = "7d" | "14d" | "30d" | "all";

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const today = new Date().toISOString().slice(0, 10);

const QUIZ_STEPS = [
  { key: "quiz_started",     label: "Quiz démarré",            threshold: 0  },
  { key: "quiz_goals",       label: "Q6 — Objectifs",          threshold: 7  },
  { key: "quiz_biometrics",  label: "Q8 — Biométriques",       threshold: 11 },
  { key: "quiz_past",        label: "Q11 — Solutions passées",  threshold: 15 },
  { key: "quiz_yes_ladders", label: "Yes-ladders",             threshold: 19 },
];

export default function FunnelClient({ sessions, leads, events, users, since }: Props) {
  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom]     = useState(since);
  const [to, setTo]         = useState(today);

  // Sync preset → from/to
  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p === "all")  { setFrom(since); setTo(today); }
    if (p === "7d")   { setFrom(addDays(today, -7));  setTo(today); }
    if (p === "14d")  { setFrom(addDays(today, -14)); setTo(today); }
    if (p === "30d")  { setFrom(addDays(today, -30)); setTo(today); }
  };

  const funnel = useMemo(() => {
    const inRange = (date: string) => date >= from && date <= to;

    // Quiz steps
    const filteredSessions = sessions.filter(s => inRange(s.date));
    const quizCounts: Record<string, number> = {};
    for (const step of QUIZ_STEPS) {
      quizCounts[step.key] = filteredSessions.filter(s => s.maxStep >= step.threshold).length;
    }

    // Optin
    const optinLeads = leads.filter(l => inRange(l.date) && l.funnelSid);
    const optinSids = new Set(optinLeads.map(l => l.funnelSid));

    // Downstream events
    const filteredEvents = events.filter(e => inRange(e.date));
    const reportViewedSids  = new Set(filteredEvents.filter(e => e.event === "report_viewed").map(e => e.sid));
    const reportCtaSids     = new Set(filteredEvents.filter(e => e.event === "report_cta_clicked").map(e => e.sid));
    const offerViewedSids   = new Set(filteredEvents.filter(e => e.event === "view_offer" && e.funnelSid).map(e => e.funnelSid));

    // All paid users in range — count every purchase, whether or not the user
    // went through the F1 lead optin (some come from retargeting, direct links,
    // or had a failed lead insert).
    const purchases = users.filter(u => inRange(u.date));

    const rows = [
      { key: "quiz_started",       label: "Quiz démarré",            n: quizCounts.quiz_started    ?? 0 },
      { key: "quiz_goals",         label: "Q6 — Objectifs",          n: quizCounts.quiz_goals      ?? 0 },
      { key: "quiz_biometrics",    label: "Q8 — Biométriques",       n: quizCounts.quiz_biometrics ?? 0 },
      { key: "quiz_past",          label: "Q11 — Solutions passées",  n: quizCounts.quiz_past       ?? 0 },
      { key: "quiz_yes_ladders",   label: "Yes-ladders",             n: quizCounts.quiz_yes_ladders ?? 0 },
      { key: "optin",              label: "Optin email",             n: optinSids.size                  },
      { key: "report_viewed",      label: "Rapport vu",              n: reportViewedSids.size           },
      { key: "report_cta_clicked", label: "CTA rapport cliqué",      n: reportCtaSids.size              },
      { key: "offer_viewed",       label: "Offer page vue",          n: offerViewedSids.size            },
      { key: "purchased",          label: "Achat",                   n: purchases.length                },
    ];

    return { rows, purchases };
  }, [sessions, leads, events, users, from, to]);

  const top = funnel.rows[0]?.n ?? 1;

  const presets: { label: string; value: Preset }[] = [
    { label: "7 jours",  value: "7d"  },
    { label: "14 jours", value: "14d" },
    { label: "30 jours", value: "30d" },
    { label: "Tout",     value: "all" },
  ];

  return (
    <main className="min-h-screen bg-ash px-6 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-6">
          <a href="/admin" className="text-xs text-mute hover:text-void transition-colors">← Admin</a>
          <h1 className="font-display text-2xl font-semibold text-void mt-2">
            Déperdition funnel
          </h1>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-wire bg-white p-4 mb-6 flex flex-wrap items-center gap-4">
          {/* Presets */}
          <div className="flex gap-2">
            {presets.map(p => (
              <button
                key={p.value}
                onClick={() => applyPreset(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  preset === p.value
                    ? "bg-void text-white"
                    : "bg-ash text-mute hover:text-void border border-wire"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-wire" />

          {/* Custom date range */}
          <div className="flex items-center gap-2 text-xs text-mute">
            <span>Du</span>
            <input
              type="date"
              value={from}
              min={since}
              max={to}
              onChange={e => { setFrom(e.target.value); setPreset("all"); }}
              className="border border-wire rounded-lg px-2 py-1.5 text-xs text-void bg-white focus:outline-none focus:border-void"
            />
            <span>au</span>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={e => { setTo(e.target.value); setPreset("all"); }}
              className="border border-wire rounded-lg px-2 py-1.5 text-xs text-void bg-white focus:outline-none focus:border-void"
            />
          </div>
        </div>

        {/* Funnel table */}
        <div className="rounded-xl border border-wire bg-white overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-wire bg-ash">
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute w-[40%]">Étape</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">N</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">% début</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">Drop étape</th>
                <th className="px-5 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {funnel.rows.map((row, i) => {
                const prev    = i > 0 ? funnel.rows[i - 1].n : row.n;
                const pctTop  = top > 0 ? Math.round(row.n / top * 100) : 0;
                const dropPct = prev > 0 && i > 0 ? Math.round((1 - row.n / prev) * 100) : 0;
                const isPostQuiz = row.key === "optin";

                return (
                  <>
                    {isPostQuiz && (
                      <tr key="divider">
                        <td colSpan={5} className="px-5 py-1.5 text-[10px] text-mute bg-ash/70 uppercase tracking-[0.1em] font-semibold border-t-2 border-wire">
                          Post-quiz
                        </td>
                      </tr>
                    )}
                    <tr key={row.key} className="border-b border-wire/60 last:border-0 hover:bg-ash/40 transition">
                      <td className="px-5 py-3.5 font-medium text-void">{row.label}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-void">
                        {row.n > 0 ? row.n : <span className="text-mute font-sans text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-dim">
                        {row.n > 0 ? `${pctTop}%` : <span className="text-mute font-sans text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold">
                        {i > 0 && prev > 0 ? (
                          <span className={
                            dropPct >= 60 ? "text-red-500" :
                            dropPct >= 30 ? "text-amber-500" :
                            dropPct > 0   ? "text-dim" : "text-mute"
                          }>
                            {dropPct > 0 ? `-${dropPct}%` : "—"}
                          </span>
                        ) : <span className="text-mute">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="h-1.5 bg-wire rounded-full overflow-hidden">
                          <div
                            className="h-full bg-void rounded-full transition-all duration-300"
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
        {funnel.purchases.length > 0 && (
          <div className="rounded-xl border border-wire bg-white overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-wire bg-ash">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">
                Clients convertis sur la période
              </p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {funnel.purchases.map(c => (
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

        {/* Legend */}
        <div className="text-xs text-mute space-y-1 border-t border-wire pt-4">
          <p className="font-semibold uppercase tracking-[0.1em] mb-2">Sources</p>
          <p>Quiz → <code className="bg-wire px-1 rounded">funnel_sessions._max_step</code></p>
          <p>Optin → <code className="bg-wire px-1 rounded">leads.payload.funnel_sid</code></p>
          <p>Rapport / CTA / Offer → <code className="bg-wire px-1 rounded">event_sessions</code> · données depuis le déploiement</p>
          <p>Achat → <code className="bg-wire px-1 rounded">users.has_paid</code> × <code className="bg-wire px-1 rounded">leads.email</code></p>
        </div>
      </div>
    </main>
  );
}
