import type { Metadata } from "next";
import ProgramLanding from "./program/ProgramLanding";

export const metadata: Metadata = {
  title: "Protocol | Get Lean Without Guesswork",
  description: "Get your personalized body analysis and transformation plan based on 2000+ academic studies."
};

export default function HomePage() {
  return <ProgramLanding funnel="main" />;
}
