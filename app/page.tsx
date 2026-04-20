import { redirect } from "next/navigation";

export default function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const qs = searchParams ? new URLSearchParams(searchParams as Record<string, string>).toString() : "";
  const destination = qs ? `/offer?${qs}` : "/offer";
  redirect(destination);
}
