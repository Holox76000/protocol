import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "../../../lib/supabase";
import NpsForm from "./NpsForm";

export const runtime = "nodejs";

export default async function NpsPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { score?: string };
}) {
  const { token } = params;
  const rawScore = parseInt(searchParams.score ?? "", 10);
  const initialScore = rawScore >= 1 && rawScore <= 10 ? rawScore : null;

  // Lookup by initial or 30d token
  const [byInitial, by30d] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, nps_submitted_at, nps_category")
      .eq("nps_token", token)
      .maybeSingle()
      .then(r => r.data),
    supabaseAdmin
      .from("users")
      .select("id, nps_30d_submitted_at")
      .eq("nps_30d_token", token)
      .maybeSingle()
      .then(r => r.data),
  ]);

  const user = byInitial ?? by30d;
  if (!user) notFound();

  const is30d = !!by30d && !byInitial;
  const alreadySubmitted = is30d
    ? !!(by30d as typeof by30d & { nps_30d_submitted_at?: string | null })?.nps_30d_submitted_at
    : !!(byInitial as typeof byInitial & { nps_submitted_at?: string | null; nps_category?: string | null })?.nps_submitted_at;

  if (alreadySubmitted) {
    const category = is30d ? "passive" : ((byInitial as { nps_category?: string | null })?.nps_category ?? "passive");
    redirect(`/nps/thanks?category=${category}`);
  }

  if (!initialScore) {
    // No score in URL — show score selector with a default
    return (
      <main style={{ minHeight: "100vh", background: "#f9fbfb" }}>
        <NpsForm token={token} initialScore={7} is30d={is30d} />
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f9fbfb" }}>
      <NpsForm token={token} initialScore={initialScore} is30d={is30d} />
    </main>
  );
}
