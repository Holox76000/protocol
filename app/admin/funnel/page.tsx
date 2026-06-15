import { requireAdmin } from "../../../lib/adminAuth";
import { supabaseAdmin } from "../../../lib/supabase";
import FunnelClient from "./FunnelClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function FunnelPage() {
  await requireAdmin();

  const SINCE = "2026-06-12T03:15:00Z"; // Report funnel deployed

  const [sessionsRes, leadsRes, eventsRes, usersRes] = await Promise.all([
    supabaseAdmin
      .from("funnel_sessions")
      .select("session_id, answers, created_at")
      .gte("created_at", SINCE)
      .not("answers->_session_id", "is", null)
      .order("created_at", { ascending: true }),

    supabaseAdmin
      .from("leads")
      .select("email, payload, created_at")
      .gte("created_at", SINCE)
      .order("created_at", { ascending: true }),

    supabaseAdmin
      .from("event_sessions")
      .select("session_id, event, payload, created_at")
      .gte("created_at", SINCE)
      .in("event", ["report_viewed", "report_cta_clicked", "view_offer"])
      .order("created_at", { ascending: true }),

    supabaseAdmin
      .from("users")
      .select("email, first_name, created_at")
      .eq("has_paid", true)
      .gte("created_at", SINCE)
      .order("created_at", { ascending: true }),
  ]);

  const sessions = (sessionsRes.data ?? []).map(s => ({
    sid: s.session_id as string,
    maxStep: Number((s.answers as Record<string, unknown>)._max_step ?? -1),
    date: (s.created_at as string).slice(0, 10),
  })).filter(s => s.maxStep >= 0);

  const leads = (leadsRes.data ?? []).map(l => ({
    email: l.email as string,
    funnelSid: String((l.payload as Record<string, unknown>)?.funnel_sid ?? ""),
    date: (l.created_at as string).slice(0, 10),
  }));

  const events = (eventsRes.data ?? []).map(e => ({
    sid: e.session_id as string,
    event: e.event as string,
    funnelSid: String((e.payload as Record<string, unknown>)?.funnel_sid ?? ""),
    date: (e.created_at as string).slice(0, 10),
  }));

  const users = (usersRes.data ?? []).map(u => ({
    email: u.email as string,
    name: (u.first_name ?? "—") as string,
    date: (u.created_at as string).slice(0, 10),
  }));

  return (
    <FunnelClient
      sessions={sessions}
      leads={leads}
      events={events}
      users={users}
      since={SINCE.slice(0, 10)}
    />
  );
}
