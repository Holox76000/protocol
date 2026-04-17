import { requireAdmin } from "../../../lib/adminAuth";
import { supabaseAdmin } from "../../../lib/supabase";
import dynamic from "next/dynamic";

const StatsClient = dynamic(() => import("./StatsClient"), { ssr: false });

export const runtime = "nodejs";

export default async function StatsPage() {
  await requireAdmin();

  const EXCLUDED_EMAILS = ["patrypierreandre", "sofiane.lekfif"];

  // Fetch all users with date + paid status (exclude internal accounts)
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("created_at, has_paid, email")
    .not("email", "ilike", `%${EXCLUDED_EMAILS[0]}%`)
    .not("email", "ilike", `%${EXCLUDED_EMAILS[1]}%`)
    .order("created_at", { ascending: true });

  // Fetch leads (exclude internal accounts)
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("created_at, email")
    .not("email", "ilike", `%${EXCLUDED_EMAILS[0]}%`)
    .not("email", "ilike", `%${EXCLUDED_EMAILS[1]}%`)
    .order("created_at", { ascending: true });

  // Build daily series starting from first event
  const allDates = [
    ...(users ?? []).map((u) => u.created_at as string),
    ...(leads ?? []).map((l) => l.created_at as string),
  ].sort();

  if (allDates.length === 0) {
    return (
      <main className="min-h-screen bg-ash px-6 py-10">
        <p className="text-dim text-sm">No data yet.</p>
      </main>
    );
  }

  // Generate every day from first event to today
  const firstDay = new Date(allDates[0]);
  firstDay.setUTCHours(0, 0, 0, 0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const days: string[] = [];
  const d = new Date(firstDay);
  while (d <= today) {
    days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }

  // Count by day
  const leadsByDay: Record<string, number> = {};
  const ordersByDay: Record<string, number> = {};

  for (const l of leads ?? []) {
    const day = (l.created_at as string).slice(0, 10);
    leadsByDay[day] = (leadsByDay[day] ?? 0) + 1;
  }
  for (const u of users ?? []) {
    const day = (u.created_at as string).slice(0, 10);
    if ((u as { has_paid: boolean }).has_paid) {
      ordersByDay[day] = (ordersByDay[day] ?? 0) + 1;
    } else {
      leadsByDay[day] = (leadsByDay[day] ?? 0) + 1;
    }
  }

  // Build chart data with cumulative totals
  let cumLeads = 0;
  let cumOrders = 0;
  const chartData = days.map((day) => {
    cumLeads += leadsByDay[day] ?? 0;
    cumOrders += ordersByDay[day] ?? 0;
    return {
      date: day,
      leads: leadsByDay[day] ?? 0,
      orders: ordersByDay[day] ?? 0,
      cumLeads,
      cumOrders,
    };
  });

  // KPIs
  const totalLeads = cumLeads;
  const totalOrders = cumOrders;
  const conversionRate = totalLeads > 0 ? ((totalOrders / totalLeads) * 100).toFixed(1) : "0";

  // Last 7 days
  const last7 = chartData.slice(-7);
  const last7Leads = last7.reduce((s, d) => s + d.leads, 0);
  const last7Orders = last7.reduce((s, d) => s + d.orders, 0);

  return (
    <StatsClient
      chartData={chartData}
      kpis={{ totalLeads, totalOrders, conversionRate, last7Leads, last7Orders }}
    />
  );
}
