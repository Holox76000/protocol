import { redirect } from "next/navigation";
import { getV3QuestionStepHref } from "./questions";

export default function V3QuestionsIndexPage() {
  redirect(getV3QuestionStepHref(1));
}
