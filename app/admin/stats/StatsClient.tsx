"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

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

const BRAND = "#253239";
const LEAD_COLOR = "#7f949b";
const ORDER_COLOR = "#253239";

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

export default function StatsClient({ chartData, kpis }: { chartData: DayData[]; kpis: Kpis }) {
  const showDailyBar = chartData.length <= 30;

  return (
    <main className="min-h-screen bg-[#f9fbfb] px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f949b]">Admin</p>
          <h1 className="mt-1 text-3xl font-normal text-[#253239]" style={{ fontFamily: "var(--font-display)" }}>
            Stats
          </h1>
          <div className="mt-4 flex gap-3">
            <a href="/admin" className="text-[13px] text-[#7f949b] hover:text-[#253239] transition-colors">
              ← Orders
            </a>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KpiCard label="Total leads" value={kpis.totalLeads} sub="since launch" />
          <KpiCard label="Total orders" value={kpis.totalOrders} sub="paid clients" />
          <KpiCard label="Conversion" value={`${kpis.conversionRate}%`} sub="leads → orders" />
          <KpiCard label="Last 7 days" value={kpis.last7Orders} sub={`${kpis.last7Leads} leads`} />
        </div>

        {/* Daily activity — bar chart */}
        <div className="bg-white rounded-2xl border border-[#edf0f1] p-6 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f949b] mb-6">
            Daily activity
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={showDailyBar ? chartData : chartData.slice(-30)}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              barCategoryGap="35%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#edf0f1" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "#7f949b" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#7f949b" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #edf0f1", fontSize: 12 }}
                labelFormatter={(label) => formatDate(String(label))}
                cursor={{ fill: "#f9fbfb" }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
              />
              <Bar dataKey="leads" name="Leads" fill={LEAD_COLOR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="orders" name="Orders" fill={ORDER_COLOR} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative — area chart (secondary) */}
        <div className="bg-white rounded-2xl border border-[#edf0f1] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f949b] mb-6">
            Cumulative total
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gLead" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={LEAD_COLOR} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={LEAD_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOrder" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ORDER_COLOR} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={ORDER_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf0f1" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "#7f949b" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#7f949b" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #edf0f1", fontSize: 12 }}
                labelFormatter={(label) => formatDate(String(label))}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
              <Area type="monotone" dataKey="cumLeads" name="Leads" stroke={LEAD_COLOR} strokeWidth={2} fill="url(#gLead)" dot={false} />
              <Area type="monotone" dataKey="cumOrders" name="Orders" stroke={ORDER_COLOR} strokeWidth={2} fill="url(#gOrder)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>
    </main>
  );
}
