import { redirect } from "next/navigation";

export default function CheckoutPage({
  searchParams,
}: {
  searchParams?: { funnel?: string };
}) {
  const funnel = searchParams?.funnel?.trim() || "main";
  const internalFunnel = funnel === "v2" ? "f2" : funnel;
  redirect(`/welcome/checkout?funnel=${encodeURIComponent(internalFunnel)}`);
}
