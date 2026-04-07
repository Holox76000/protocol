import type { Metadata } from "next";
import F1SignupPage from "./F1SignupPage";

export const metadata: Metadata = {
  title: "Your analysis — Protocol",
  description: "Enter your first name and email to access your personalized protocol.",
};

export default function F1SignupRoute() {
  return <F1SignupPage />;
}
