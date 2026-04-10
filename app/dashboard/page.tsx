import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession, SESSION_COOKIE_NAME } from "../../lib/auth";
import { supabaseAdmin } from "../../lib/supabase";
import DashboardPage from "./DashboardPage";

export const runtime = "nodejs";

const REFINEMENT_WINDOW_MS = 5 * 60 * 60 * 1000; // 5 hours

export default async function Dashboard({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) redirect("/login?next=/dashboard");

  const user = await validateSession(sessionToken);
  if (!user) redirect("/login?next=/dashboard");

  // Redirect unpaid users to the checkout page, unless returning from payment
  const paymentSuccess = searchParams?.payment === "success";
  if (!user.has_paid && !paymentSuccess) redirect("/checkout");

  let submittedAt: string | null = null;

  if (user.protocol_status === "questionnaire_submitted") {
    const { data } = await supabaseAdmin
      .from("questionnaire_responses")
      .select("submitted_at")
      .eq("user_id", user.id)
      .maybeSingle();

    submittedAt = (data?.submitted_at as string) ?? null;

    // If the 5-hour refinement window has expired, auto-advance to in_review
    if (submittedAt && Date.now() - new Date(submittedAt).getTime() > REFINEMENT_WINDOW_MS) {
      await supabaseAdmin
        .from("users")
        .update({ protocol_status: "in_review" })
        .eq("id", user.id);
      user.protocol_status = "in_review";
      submittedAt = null;
    }
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-pebble" />}>
      <DashboardPage user={user} submittedAt={submittedAt} />
    </Suspense>
  );
}
