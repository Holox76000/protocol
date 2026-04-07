import { redirect } from "next/navigation";
import WomanQuizAnswerInsightStep from "../WomanQuizAnswerInsightStep";
import WomanQuizFinalStep from "../WomanQuizFinalStep";
import WomanQuizStep from "../WomanQuizStep";
import { getWomanQuizScreen, getWomanQuizStepCount } from "../woman-quiz-data";

export const metadata = {
  title: "Protocol | Women Quiz",
  description: "Women’s transformation questionnaire before checkout.",
};
export const dynamic = "force-dynamic";

export default function WomanQuizStepPage({ params }: { params: { step: string } }) {
  const step = Number(params.step);
  const screen = getWomanQuizScreen(step);

  if (!Number.isFinite(step) || step < 1 || step > getWomanQuizStepCount() || !screen) {
    redirect("/woman/quiz/1");
  }

  if (screen.kind === "final") {
    return <WomanQuizFinalStep />;
  }

  if (screen.kind === "insight") {
    return <WomanQuizAnswerInsightStep questionIndex={screen.questionIndex} routeStep={step} />;
  }

  return <WomanQuizStep questionIndex={screen.questionIndex} routeStep={step} />;
}
