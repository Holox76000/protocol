import type { Metadata } from "next";
import { notFound } from "next/navigation";
import V3QuestionnaireStep from "../v3-questionnaire-step";
import { QUESTION_COUNT } from "../questions";

export const metadata: Metadata = {
  title: "Protocol | Questionnaire",
  description: "Answer a short transformation questionnaire before continuing to checkout.",
};
export const dynamic = "force-dynamic";

export default function V3QuestionStepPage({
  params,
}: {
  params: { step: string };
}) {
  const step = Number(params.step);

  if (!Number.isInteger(step) || step < 1 || step > QUESTION_COUNT) {
    notFound();
  }

  return <V3QuestionnaireStep step={step} />;
}
