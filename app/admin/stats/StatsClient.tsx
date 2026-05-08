"use client";

import { useState, useMemo } from "react";

type DayData = {
  date: string;
  leads: number;
  orders: number;
  revenue: number;
  cumLeads: number;
  cumOrders: number;
};

type FunnelSession = { date: string; maxStep: number };

type DropoffRow = {
  step: number;
  name: string;
  count: number;
  pctTotal: number;
  dropPct: number;
};

const SLIDE_NAMES = [
  "Intro", "Age", "Stat — age", "Ethnicity", "Body type",
  "Confidence", "Timeline", "Goals", "Social proof",
  "Height", "Weight", "Time / week", "Info — time", "Social env",
  "Past solutions", "Photo upload", "Summary", "Promise",
  "Yes-ladder 1", "Yes-ladder 2", "Yes-ladder 3",
  "Final loading", "Protocol ready",
];

function computeDropoff(sessions: FunnelSession[], from: string, to: string): DropoffRow[] {
  const filtered = sessions.filter((s) => {
    if (from && s.date < from) return false;
    if (to && s.date > to) return false;
    return true;
  });
  const reached: number[] = new Array(SLIDE_NAMES.length).fill(0);
  for (const s of filtered) {
    for (let i = 0; i <= s.maxStep && i < SLIDE_NAMES.length; i++) {
      reached[i]++;
    }
  }
  const total = reached[0] ?? 0;
  return SLIDE_NAMES.map((name, i) => {
    const count = reached[i] ?? 0;
    const prev = i > 0 ? (reached[i - 1] ?? 0) : count;
    const dropPct = prev > 0 ? Math.round((1 - count / prev) * 100) : 0;
    const pctTotal = total > 0 ? Math.round((count / total) * 100) : 0;
    return { step: i, name, count, pctTotal, dropPct };
  });
}

const LEAD_COLOR = "#7f949b";
const ORDER_COLOR = "#253239";
const W = 600;
const BAR_H = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 32 };

type Preset = "7d" | "30d" | "90d" | "all";

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("fr-FR", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function isoWeekLabel(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (dt: Date) =>
    dt.toLocaleDateString("fr-FR", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function isoWeekKey(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#edf0f1] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f949b] mb-3">{label}</p>
      <p className="text-[36px] font-light text-[#253239] leading-none">{value}</p>
      {sub && <p className="mt-2 text-[12px] text-[#7f949b]">{sub}</p>}
    </div>
  );
}

function LineChartSvg({ data }: { data: DayData[] }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.leads, d.orders)), 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = BAR_H - PAD.top - PAD.bottom;
  const xStep = innerW / Math.max(data.length - 1, 1);

  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  const pointsFor = (key: "leads" | "orders") =>
    data.map((d, i) => [i * xStep, innerH - (d[key] / maxVal) * innerH] as [number, number]);

  const toPath = (pts: [number, number][]) => {
    if (pts.length === 0) return "";
    return pts.reduce((acc, [x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = pts[i - 1];
      const cpx = (px + x) / 2;
      return `${acc} C ${cpx} ${py} ${cpx} ${y} ${x} ${y}`;
    }, "");
  };

  const toArea = (pts: [number, number][]) => {
    if (pts.length === 0) return "";
    return `${toPath(pts)} L ${pts[pts.length - 1][0]} ${innerH} L ${pts[0][0]} ${innerH} Z`;
  };

  const leadsPoints = pointsFor("leads");
  const ordersPoints = pointsFor("orders");

  return (
    <svg viewBox={`0 0 ${W} ${BAR_H}`} className="w-full" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={LEAD_COLOR} stopOpacity={0.18} />
          <stop offset="100%" stopColor={LEAD_COLOR} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ORDER_COLOR} stopOpacity={0.18} />
          <stop offset="100%" stopColor={ORDER_COLOR} stopOpacity={0} />
        </linearGradient>
      </defs>

      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {yTicks.map((t) => {
          const y = innerH - (t / maxVal) * innerH;
          return (
            <g key={t}>
              <line x1={0} y1={y} x2={innerW} y2={y} stroke="#edf0f1" strokeWidth={1} />
              <text x={-4} y={y + 4} textAnchor="end" fontSize={10} fill="#7f949b">{t}</text>
            </g>
          );
        })}

        <path d={toArea(leadsPoints)} fill="url(#gradLeads)" />
        <path d={toArea(ordersPoints)} fill="url(#gradOrders)" />

        <path d={toPath(leadsPoints)} fill="none" stroke={LEAD_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
        <path d={toPath(ordersPoints)} fill="none" stroke={ORDER_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => {
          if (data.length > 10 && i % Math.ceil(data.length / 8) !== 0) return null;
          return (
            <text key={d.date} x={i * xStep} y={innerH + 16} textAnchor="middle" fontSize={9} fill="#7f949b">
              {formatDate(d.date)}
            </text>
          );
        })}
      </g>

      <g transform={`translate(${PAD.left}, ${BAR_H - 4})`}>
        <line x1={0} y1={4} x2={16} y2={4} stroke={LEAD_COLOR} strokeWidth={2} opacity={0.8} />
        <text x={20} y={8} fontSize={10} fill="#7f949b">Leads</text>
        <line x1={60} y1={4} x2={76} y2={4} stroke={ORDER_COLOR} strokeWidth={2} />
        <text x={80} y={8} fontSize={10} fill="#7f949b">Orders</text>
      </g>
    </svg>
  );
}

function FunnelDropoff({ rows, from, to }: { rows: DropoffRow[]; from: string; to: string }) {
  const label = from && to ? `${from} → ${to}` : from || to || "all time";
  if (rows.length === 0) return null;
  const topDrops = [...rows]
    .sort((a, b) => b.dropPct - a.dropPct)
    .slice(0, 3)
    .map((r) => r.step);

  return (
    <div className="bg-white rounded-2xl border border-[#edf0f1] p-6 mt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f949b] mb-6">
        Funnel Drop-off — {label}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#edf0f1]">
              <th className="pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b] w-8">Step</th>
              <th className="pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b]">Slide</th>
              <th className="pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b] text-right">Sessions</th>
              <th className="pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b] text-right">% total</th>
              <th className="pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b] text-right">Drop vs prev</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isHighDrop = topDrops.includes(r.step) && r.dropPct > 0;
              return (
                <tr key={r.step} className="border-b border-[#edf0f1] last:border-0 hover:bg-[#f9fbfb] transition-colors">
                  <td className="py-2.5 text-[12px] text-[#7f949b]">{r.step}</td>
                  <td className="py-2.5 text-[13px] text-[#253239]">{r.name}</td>
                  <td className="py-2.5 text-[13px] text-[#253239] text-right font-medium">{r.count}</td>
                  <td className="py-2.5 text-[12px] text-[#7f949b] text-right">{r.pctTotal}%</td>
                  <td className="py-2.5 text-right">
                    {r.step === 0 ? (
                      <span className="text-[12px] text-[#7f949b]">—</span>
                    ) : (
                      <span className={`text-[12px] font-medium px-2 py-0.5 rounded ${
                        isHighDrop
                          ? "bg-red-50 text-red-700"
                          : "text-[#7f949b]"
                      }`}>
                        {r.dropPct}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StatsClient({ chartData, funnelSessions }: { chartData: DayData[]; funnelSessions: FunnelSession[] }) {
  const [preset, setPreset] = useState<Preset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const filteredData = useMemo(() => {
    if (preset !== "all" && customFrom === "" && customTo === "") {
      const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
      return chartData.slice(-days);
    }
    if (customFrom || customTo) {
      return chartData.filter((d) => {
        if (customFrom && d.date < customFrom) return false;
        if (customTo && d.date > customTo) return false;
        return true;
      });
    }
    return chartData;
  }, [chartData, preset, customFrom, customTo]);

  const kpis = useMemo(() => {
    const totalLeads = filteredData.reduce((s, d) => s + d.leads, 0);
    const totalOrders = filteredData.reduce((s, d) => s + d.orders, 0);
    const totalRevenue = filteredData.reduce((s, d) => s + d.revenue, 0);
    const conversionRate = totalLeads > 0 ? ((totalOrders / totalLeads) * 100).toFixed(1) : "0";
    return { totalLeads, totalOrders, totalRevenue, conversionRate };
  }, [filteredData]);

  const weeklyData = useMemo(() => {
    const map = new Map<string, { label: string; leads: number; orders: number; revenue: number }>();
    for (const d of filteredData) {
      const key = isoWeekKey(d.date);
      const existing = map.get(key);
      if (existing) {
        existing.leads += d.leads;
        existing.orders += d.orders;
        existing.revenue += d.revenue;
      } else {
        map.set(key, { label: isoWeekLabel(d.date), leads: d.leads, orders: d.orders, revenue: d.revenue });
      }
    }
    return Array.from(map.values()).reverse();
  }, [filteredData]);

  const dropoffFrom = filteredData.length > 0 ? filteredData[0].date : "";
  const dropoffTo = filteredData.length > 0 ? filteredData[filteredData.length - 1].date : "";
  const dropoffRows = useMemo(() => {
    return computeDropoff(funnelSessions, dropoffFrom, dropoffTo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funnelSessions, filteredData]);

  const PRESETS: { id: Preset; label: string }[] = [
    { id: "7d", label: "7 jours" },
    { id: "30d", label: "30 jours" },
    { id: "90d", label: "90 jours" },
    { id: "all", label: "Tout" },
  ];

  function handlePreset(p: Preset) {
    setPreset(p);
    setCustomFrom("");
    setCustomTo("");
  }

  function handleCustomDate(field: "from" | "to", value: string) {
    if (field === "from") setCustomFrom(value);
    else setCustomTo(value);
    setPreset("all");
  }

  return (
    <main className="min-h-screen bg-[#f9fbfb] px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f949b]">Admin</p>
          <h1 className="mt-1 text-3xl font-normal text-[#253239]" style={{ fontFamily: "var(--font-display)" }}>
            Stats
          </h1>
          <div className="mt-4">
            <a href="/admin" className="text-[13px] text-[#7f949b] hover:text-[#253239] transition-colors">
              ← Orders
            </a>
          </div>
        </div>

        {/* Date selector */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  preset === p.id && customFrom === "" && customTo === ""
                    ? "bg-[#253239] text-white"
                    : "bg-white border border-[#edf0f1] text-[#7f949b] hover:text-[#253239]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => handleCustomDate("from", e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#edf0f1] text-[12px] text-[#253239] bg-white"
            />
            <span className="text-[12px] text-[#7f949b]">→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => handleCustomDate("to", e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#edf0f1] text-[12px] text-[#253239] bg-white"
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Leads" value={kpis.totalLeads} sub="période sélectionnée" />
          <KpiCard label="Orders" value={kpis.totalOrders} sub="clients payants" />
          <KpiCard label="Conversion" value={`${kpis.conversionRate}%`} sub="leads → orders" />
          <KpiCard label="Revenue" value={formatCurrency(kpis.totalRevenue)} sub="période sélectionnée" />
        </div>

        {/* Daily line chart */}
        <div className="bg-white rounded-2xl border border-[#edf0f1] p-6 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f949b] mb-6">
            Activité quotidienne
          </p>
          <LineChartSvg data={filteredData} />
        </div>

        {/* Weekly revenue table */}
        <div className="bg-white rounded-2xl border border-[#edf0f1] p-6 mb-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f949b] mb-6">
            C.A. par semaine
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#edf0f1]">
                  <th className="pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b]">Semaine</th>
                  <th className="pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b] text-right">Leads</th>
                  <th className="pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b] text-right">Orders</th>
                  <th className="pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b] text-right">C.A.</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[13px] text-[#7f949b]">Aucune donnée</td>
                  </tr>
                ) : (
                  weeklyData.map((w, i) => (
                    <tr key={i} className="border-b border-[#edf0f1] last:border-0 hover:bg-[#f9fbfb] transition-colors">
                      <td className="py-3 text-[13px] text-[#253239]">{w.label}</td>
                      <td className="py-3 text-[13px] text-[#7f949b] text-right">{w.leads}</td>
                      <td className="py-3 text-[13px] text-[#253239] text-right font-medium">{w.orders}</td>
                      <td className="py-3 text-[13px] text-[#253239] text-right font-medium">{formatCurrency(w.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#edf0f1]">
                  <td className="pt-3 text-[12px] font-semibold text-[#253239]">Total</td>
                  <td className="pt-3 text-[12px] text-[#7f949b] text-right">{weeklyData.reduce((s, w) => s + w.leads, 0)}</td>
                  <td className="pt-3 text-[12px] font-semibold text-[#253239] text-right">{weeklyData.reduce((s, w) => s + w.orders, 0)}</td>
                  <td className="pt-3 text-[12px] font-semibold text-[#253239] text-right">{formatCurrency(weeklyData.reduce((s, w) => s + w.revenue, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Funnel drop-off */}
        <FunnelDropoff rows={dropoffRows} from={dropoffFrom} to={dropoffTo} />

      </div>
    </main>
  );
}
