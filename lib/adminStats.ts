import { supabaseAdmin } from "./supabase";

export type StepStats = {
  label: string;
  count: number;
};

export type AdminStats = {
  started: number;
  steps: StepStats[];
  optinViewed: number;
  leadSubmitted: number;
  resultViewed: number;
};

async function countBy(event: string, step?: number): Promise<number> {
  const query = supabaseAdmin
    .from("event_sessions")
    .select("id", { count: "exact", head: true })
    .eq("event", event);

  const finalQuery = typeof step === "number" ? query.eq("step", step) : query;
  const { count, error } = await finalQuery;
  if (error) throw error;
  return count ?? 0;
}

export async function getAdminStats(): Promise<AdminStats> {
  const started = await countBy("quiz_started");

  const steps: StepStats[] = [];
  for (let i = 1; i <= 9; i += 1) {
    const count = await countBy("question_answered", i);
    steps.push({ label: `Step ${i}`, count });
  }

  const optinViewed = await countBy("optin_viewed");
  const leadSubmitted = await countBy("lead_submitted");
  const resultViewed = await countBy("result_viewed");

  return {
    started,
    steps,
    optinViewed,
    leadSubmitted,
    resultViewed
  };
}
