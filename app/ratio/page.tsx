import type { Metadata } from "next";
import RatioClient from "./RatioClient";

export const metadata: Metadata = {
  title: "Body Ratio Analyzer — Protocol Club",
  robots: "noindex",
};

export default function RatioPage() {
  return <RatioClient />;
}
