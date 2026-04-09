import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "../../lib/auth";
import { SESSION_COOKIE_NAME } from "../../lib/auth-constants";
import { supabaseAdmin } from "../../lib/supabase";
import QuestionnaireFlow from "./QuestionnaireFlow";

export default async function QuestionnairePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) redirect("/login?next=/questionnaire");

  const user = await validateSession(token);
  if (!user) redirect("/login?next=/questionnaire");

  const { data: existing } = await supabaseAdmin
    .from("questionnaire_responses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "submitted") {
    // Allow access during the 5-hour refinement window
    const submittedAt = existing.submitted_at as string | null;
    const withinWindow =
      submittedAt &&
      Date.now() - new Date(submittedAt).getTime() < 5 * 60 * 60 * 1000;

    if (!withinWindow) redirect("/dashboard");
  }

  // Block once finalized
  if (user.protocol_status === "in_review" || user.protocol_status === "delivered") {
    redirect("/dashboard");
  }

  return (
    <QuestionnaireFlow
      user={user}
      initialAnswers={existing ?? {}}
      initialSection={existing?.current_section ?? 1}
    />
  );
}
