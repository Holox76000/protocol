"use client";

type DayData = {
  date: string;
  leads: number;
  orders: number;
  cumLeads: number;
  cumOrders: number;
};

type Kpis = {
  totalLeads: number;
  totalOrders: number;
  conversionRate: string;
  last7Leads: number;
  last7Orders: number;
};

const LEAD_COLOR = "#7f949b";
const ORDER_COLOR = "#253239";
const W = 600;
const BAR_H = 220;
const AREA_H = 180;
const PAD = { top: 12, right: 8, bottom: 28, left: 32 };

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("fr-FR", { month: "short", day: "numeric", timeZone: "UTC" });
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

function BarChartSvg({ data }: { data: DayData[] }) {
  const display = data.slice(-30);
  const maxVal = Math.max(...display.map((d) => d.leads + d.orders), 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = BAR_H - PAD.top - PAD.bottom;
  const barGroupW = innerW / display.length;
  const barW = Math.max(3, barGroupW * 0.35);

  // Y-axis ticks
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  return (
    <svg viewBox={`0 0 ${W} ${BAR_H}`} className="w-full" style={{ overflow: "visible" }}>
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {/* Grid lines */}
        {yTicks.map((t) => {
          const y = innerH - (t / maxVal) * innerH;
          return (
            <g key={t}>
              <line x1={0} y1={y} x2={innerW} y2={y} stroke="#edf0f1" strokeWidth={1} />
              <text x={-4} y={y + 4} textAnchor="end" fontSize={10} fill="#7f949b">{t}</text>
            </g>
          );
        })}

        {/* Bars */}
        {display.map((d, i) => {
          const cx = i * barGroupW + barGroupW / 2;
          const leadsH = (d.leads / maxVal) * innerH;
          const ordersH = (d.orders / maxVal) * innerH;

          return (
            <g key={d.date}>
              {/* Leads bar */}
              <rect
                x={cx - barW - 1}
                y={innerH - leadsH}
                width={barW}
                height={leadsH}
                fill={LEAD_COLOR}
                rx={2}
                opacity={0.7}
              />
              {/* Orders bar */}
              <rect
                x={cx + 1}
                y={innerH - ordersH}
                width={barW}
                height={ordersH}
                fill={ORDER_COLOR}
                rx={2}
              />
              {/* X label — show every N labels to avoid crowding */}
              {(display.length <= 10 || i % Math.ceil(display.length / 8) === 0) && (
                <text
                  x={cx}
                  y={innerH + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#7f949b"
                >
                  {formatDate(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Legend */}
      <g transform={`translate(${PAD.left}, ${BAR_H - 4})`}>
        <rect x={0} y={0} width={8} height={8} fill={LEAD_COLOR} rx={2} opacity={0.7} />
        <text x={12} y={8} fontSize={10} fill="#7f949b">Leads</text>
        <rect x={52} y={0} width={8} height={8} fill={ORDER_COLOR} rx={2} />
        <text x={64} y={8} fontSize={10} fill="#7f949b">Orders</text>
      </g>
    </svg>
  );
}

function AreaChartSvg({ data }: { data: DayData[] }) {
  const maxVal = Math.max(...data.map((d) => d.cumLeads), 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = AREA_H - PAD.top - PAD.bottom;
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  function px(i: number) {
    return (i / (data.length - 1 || 1)) * innerW;
  }
  function py(v: number) {
    return innerH - (v / maxVal) * innerH;
  }

  const leadPoints = data.map((d, i) => `${px(i)},${py(d.cumLeads)}`).join(" ");
  const orderPoints = data.map((d, i) => `${px(i)},${py(d.cumOrders)}`).join(" ");
  const leadArea = `${px(0)},${innerH} ${leadPoints} ${px(data.length - 1)},${innerH}`;
  const orderArea = `${px(0)},${innerH} ${orderPoints} ${px(data.length - 1)},${innerH}`;

  return (
    <svg viewBox={`0 0 ${W} ${AREA_H}`} className="w-full" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={LEAD_COLOR} stopOpacity={0.2} />
          <stop offset="100%" stopColor={LEAD_COLOR} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ORDER_COLOR} stopOpacity={0.25} />
          <stop offset="100%" stopColor={ORDER_COLOR} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {yTicks.map((t) => {
          const y = py(t);
          return (
            <g key={t}>
              <line x1={0} y1={y} x2={innerW} y2={y} stroke="#edf0f1" strokeWidth={1} />
              <text x={-4} y={y + 4} textAnchor="end" fontSize={10} fill="#7f949b">{t}</text>
            </g>
          );
        })}

        <polygon points={leadArea} fill="url(#gL)" />
        <polyline points={leadPoints} fill="none" stroke={LEAD_COLOR} strokeWidth={2} strokeLinejoin="round" />

        <polygon points={orderArea} fill="url(#gO)" />
        <polyline points={orderPoints} fill="none" stroke={ORDER_COLOR} strokeWidth={2} strokeLinejoin="round" />

        {/* X axis labels */}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
          <text key={i} x={px(i)} y={innerH + 16} textAnchor="middle" fontSize={9} fill="#7f949b">
            {formatDate(data[i].date)}
          </text>
        ))}
      </g>

      {/* Legend */}
      <g transform={`translate(${PAD.left}, ${AREA_H - 4})`}>
        <rect x={0} y={0} width={8} height={8} fill={LEAD_COLOR} rx={2} opacity={0.7} />
        <text x={12} y={8} fontSize={10} fill="#7f949b">Leads</text>
        <rect x={52} y={0} width={8} height={8} fill={ORDER_COLOR} rx={2} />
        <text x={64} y={8} fontSize={10} fill="#7f949b">Orders</text>
      </g>
    </svg>
  );
}

export default function StatsClient({ chartData, kpis }: { chartData: DayData[]; kpis: Kpis }) {
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

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KpiCard label="Total leads" value={kpis.totalLeads} sub="since launch" />
          <KpiCard label="Total orders" value={kpis.totalOrders} sub="paid clients" />
          <KpiCard label="Conversion" value={`${kpis.conversionRate}%`} sub="leads → orders" />
          <KpiCard label="Last 7 days" value={kpis.last7Orders} sub={`${kpis.last7Leads} leads`} />
        </div>

        {/* Daily bar chart */}
        <div className="bg-white rounded-2xl border border-[#edf0f1] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f949b] mb-6">
            Daily activity {chartData.length > 30 ? "(last 30 days)" : ""}
          </p>
          <BarChartSvg data={chartData} />
        </div>

      </div>
    </main>
  );
}
