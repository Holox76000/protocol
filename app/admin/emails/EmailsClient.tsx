"use client";

import type { RoleMetrics } from "./page";

type Props = {
  range: string;
  metrics: RoleMetrics[];
  suppressions: { email: string; reason: string; when: string }[];
  leads: { total: number; paused: number; stepCounts: Record<"e2" | "e3" | "e4" | "e5" | "e6" | "e7", number> };
  sales: { paidCount: number; revenueCents: number };
};

function pct(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

const RANGES: { label: string; value: string }[] = [
  { label: "7 jours",  value: "7d"  },
  { label: "30 jours", value: "30d" },
  { label: "Tout",     value: "all" },
];

export default function EmailsClient({ range, metrics, suppressions, leads, sales }: Props) {
  const totalSent = metrics.reduce((s, m) => s + m.sent, 0);
  const totalDelivered = metrics.reduce((s, m) => s + m.delivered, 0);
  const totalComplained = metrics.reduce((s, m) => s + m.complained, 0);
  const complaintRate = totalDelivered > 0 ? totalComplained / totalDelivered : 0;
  const complaintAlert = complaintRate >= 0.001;

  // Revenue attributed across all email roles (sum of "paid recipients" per row × ticket).
  // Will double-count if a paid user received multiple emails — that's by design here:
  // each row shows "recipients-of-this-email who paid", not strict last-touch attribution.
  const attributedRevenueCents = metrics.reduce((s, m) => s + m.revenueCents, 0);
  const attributedPaidCount = metrics.reduce((s, m) => s + m.paid, 0);

  return (
    <main className="min-h-screen bg-ash px-6 py-10">
      <div className="mx-auto max-w-5xl">

        <div className="mb-6">
          <a href="/admin" className="text-xs text-mute hover:text-void transition-colors">← Admin</a>
          <h1 className="font-display text-2xl font-semibold text-void mt-2">
            Email — performance & monitoring
          </h1>
          <p className="text-xs text-mute mt-1">
            Resend events agrégés par rôle d'email · Période : {range}
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          {RANGES.map(r => (
            <a
              key={r.value}
              href={`?range=${r.value}`}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                range === r.value
                  ? "bg-void text-white border-void"
                  : "bg-ash text-dim border-wire hover:bg-wire"
              }`}
            >
              {r.label}
            </a>
          ))}
        </div>

        {/* Top-level KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <Kpi label="Emails envoyés"  value={totalSent.toString()} />
          <Kpi label="Délivrés"          value={totalDelivered.toString()} />
          <Kpi label="Leads actifs"      value={(leads.total - leads.paused).toString()} sub={`${leads.paused} en pause`} />
          <Kpi
            label="Taux complaint"
            value={pct(complaintRate)}
            sub={complaintAlert ? "⚠ ≥ 0,1 % — alerte deliverability" : "OK"}
            alert={complaintAlert}
          />
        </div>

        {/* Sales KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Kpi label="Achats totaux"        value={sales.paidCount.toString()} sub="all-time"/>
          <Kpi label="Revenu total"         value={dollars(sales.revenueCents)} sub="all-time"/>
          <Kpi
            label="Achats touchés email"
            value={attributedPaidCount.toString()}
            sub={`${pct(sales.paidCount > 0 ? attributedPaidCount / (sales.paidCount * metrics.length) : 0)} reach moyen`}
          />
          <Kpi
            label="Revenu attribué"
            value={dollars(attributedRevenueCents)}
            sub="somme par email (double comptage si multi-touch)"
          />
        </div>

        {/* Per-email metrics table */}
        <div className="bg-white border border-wire rounded-xl overflow-hidden mb-8">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-ash border-b border-wire">
                <th className="text-left  px-4 py-3 font-semibold text-void">Email</th>
                <th className="text-right px-4 py-3 font-semibold text-void">Sent</th>
                <th className="text-right px-4 py-3 font-semibold text-void">Delivered</th>
                <th className="text-right px-4 py-3 font-semibold text-void">Opened</th>
                <th className="text-right px-4 py-3 font-semibold text-void">Open %</th>
                <th className="text-right px-4 py-3 font-semibold text-void">Clicked</th>
                <th className="text-right px-4 py-3 font-semibold text-void">CTR</th>
                <th className="text-right px-4 py-3 font-semibold text-void">Bounce</th>
                <th className="text-right px-4 py-3 font-semibold text-void">Complaint</th>
                <th className="text-right px-4 py-3 font-semibold text-void bg-ash/40 border-l border-wire">Paid</th>
                <th className="text-right px-4 py-3 font-semibold text-void bg-ash/40">Conv %</th>
                <th className="text-right px-4 py-3 font-semibold text-void bg-ash/40">Revenu</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(m => (
                <tr key={m.role} className="border-b border-wire/60 last:border-0 hover:bg-ash/40 transition">
                  <td className="px-4 py-3 font-medium text-void">{m.label}</td>
                  <td className="px-4 py-3 text-right font-mono text-dim">{m.sent || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-dim">{m.delivered || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-dim">{m.opened || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-dim">{pct(m.openRate)}</td>
                  <td className="px-4 py-3 text-right font-mono text-dim">{m.clicked || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-void">{pct(m.ctr)}</td>
                  <td className="px-4 py-3 text-right font-mono text-dim">{m.bounced || "—"}</td>
                  <td className={`px-4 py-3 text-right font-mono ${m.complained > 0 ? "text-red-500 font-semibold" : "text-dim"}`}>
                    {m.complained || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-void border-l border-wire">{m.paid || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-void">{pct(m.conversionRate)}</td>
                  <td className="px-4 py-3 text-right font-mono text-void">{m.revenueCents > 0 ? dollars(m.revenueCents) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lead nurture funnel */}
        <div className="bg-white border border-wire rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-void mb-3">Lead nurture en cours</h2>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2 text-xs">
            <Funnel n={leads.total - leads.paused}   label="Actifs"     />
            <Funnel n={leads.stepCounts.e2} label="E2 envoyé" />
            <Funnel n={leads.stepCounts.e3} label="E3 envoyé" />
            <Funnel n={leads.stepCounts.e4} label="E4 envoyé" />
            <Funnel n={leads.stepCounts.e5} label="E5 envoyé" />
            <Funnel n={leads.stepCounts.e6} label="E6 envoyé" />
            <Funnel n={leads.stepCounts.e7} label="E7 envoyé" />
          </div>
          <p className="text-[10px] text-mute mt-3">
            {leads.paused} pause(s) cumulée(s) · {sales.paidCount} achats all-time · conv lead → paid : {leads.total > 0 ? pct(sales.paidCount / leads.total) : "—"}
          </p>
        </div>

        {/* Suppressions recent */}
        {suppressions.length > 0 && (
          <div className="bg-white border border-wire rounded-xl p-5">
            <h2 className="text-sm font-semibold text-void mb-3">Suppressions récentes ({suppressions.length})</h2>
            <div className="space-y-1.5 text-xs">
              {suppressions.slice(0, 20).map((s, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-wire/40 last:border-0">
                  <span className="font-mono text-dim">{s.email}</span>
                  <span className="text-mute">{s.reason} · {s.when}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Kpi({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${alert ? "bg-red-50 border-red-200" : "bg-white border-wire"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-mute">{label}</p>
      <p className={`mt-1 text-xl font-mono font-semibold ${alert ? "text-red-600" : "text-void"}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-[10px] ${alert ? "text-red-500" : "text-mute"}`}>{sub}</p>}
    </div>
  );
}

function Funnel({ n, label }: { n: number; label: string }) {
  return (
    <div className="p-3 rounded-lg bg-ash border border-wire/60 text-center">
      <p className="text-lg font-mono font-semibold text-void">{n}</p>
      <p className="text-[10px] text-mute mt-0.5">{label}</p>
    </div>
  );
}
