import { redirect } from "next/navigation";

export default function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  // Preserve any query params (UTMs, fbclid, etc.) on the redirect
  const qs = searchParams ? new URLSearchParams(searchParams as Record<string, string>).toString() : "";
  const destination = qs ? `/f1/offer?${qs}` : "/f1/offer";
  redirect(destination);
}
