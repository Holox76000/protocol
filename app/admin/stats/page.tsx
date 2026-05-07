import { requireAdmin } from "../../../lib/adminAuth";
import { supabaseAdmin } from "../../../lib/supabase";
import dynamic from "next/dynamic";

const StatsClient = dynamic(() => import("./StatsClient"), { ssr: false });

export const runtime = "nodejs";

export default async function StatsPage() {
  await requireAdmin();

  const EXCLUDED_EMAILS = ["patrypierreandre", "sofiane.lekfif", "thibault.cdn", "reddotgrowth.com"];

  // Fetch all users with date + paid status (exclude internal accounts)
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("created_at, has_paid, email, paid_amount_cents")
    .not("email", "ilike", `%${EXCLUDED_EMAILS[0]}%`)
    .not("email", "ilike", `%${EXCLUDED_EMAILS[1]}%`)
    .not("email", "ilike", `%${EXCLUDED_EMAILS[2]}%`)
    .not("email", "ilike", `%${EXCLUDED_EMAILS[3]}%`)
    .order("created_at", { ascending: true });

  // Fetch leads (exclude internal accounts)
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("created_at, email")
    .not("email", "ilike", `%${EXCLUDED_EMAILS[0]}%`)
    .not("email", "ilike", `%${EXCLUDED_EMAILS[1]}%`)
    .not("email", "ilike", `%${EXCLUDED_EMAILS[2]}%`)
    .not("email", "ilike", `%${EXCLUDED_EMAILS[3]}%`)
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
  const revenueByDay: Record<string, number> = {};

  const FALLBACK_PRICE_CENTS = 8900;

  for (const l of leads ?? []) {
    const day = (l.created_at as string).slice(0, 10);
    leadsByDay[day] = (leadsByDay[day] ?? 0) + 1;
  }
  for (const u of users ?? []) {
    const day = (u.created_at as string).slice(0, 10);
    leadsByDay[day] = (leadsByDay[day] ?? 0) + 1;
    if ((u as { has_paid: boolean }).has_paid) {
      ordersByDay[day] = (ordersByDay[day] ?? 0) + 1;
      const cents = (u as { paid_amount_cents: number | null }).paid_amount_cents ?? FALLBACK_PRICE_CENTS;
      revenueByDay[day] = (revenueByDay[day] ?? 0) + cents;
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
      revenue: revenueByDay[day] ?? 0,
      cumLeads,
      cumOrders,
    };
  });

  // Funnel drop-off — last 30 days
  const { data: sessions } = await supabaseAdmin
    .from("funnel_sessions")
    .select("answers")
    .not("answers->_max_step", "is", null)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const SLIDE_NAMES = [
    "Intro", "Age", "Stat — age", "Ethnicity", "Body type",
    "Confidence", "Timeline", "Goals", "Social proof",
    "Height", "Weight", "Time / week", "Info — time", "Social env",
    "Past solutions", "Photo upload", "Summary", "Promise",
    "Yes-ladder 1", "Yes-ladder 2", "Yes-ladder 3",
    "Final loading", "Protocol ready",
  ];

  // reached[N] = sessions where _max_step >= N (arrived at step N at least once)
  const reached: number[] = new Array(SLIDE_NAMES.length).fill(0);
  for (const s of sessions ?? []) {
    const maxStep = Number((s.answers as Record<string, unknown>)._max_step ?? -1);
    if (maxStep >= 0) {
      for (let i = 0; i <= maxStep && i < SLIDE_NAMES.length; i++) {
        reached[i]++;
      }
    }
  }
  const totalSessions = reached[0] ?? 0;
  const dropoffRows = SLIDE_NAMES.map((name, i) => {
    const count = reached[i] ?? 0;
    const prev = i > 0 ? (reached[i - 1] ?? 0) : count;
    const dropPct = prev > 0 ? Math.round((1 - count / prev) * 100) : 0;
    const pctTotal = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
    return { step: i, name, count, pctTotal, dropPct };
  });

  return (
    <StatsClient
      chartData={chartData}
      dropoffRows={dropoffRows}
    />
  );
}
