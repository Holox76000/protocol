import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/adminAuth";

export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");
  return <>{children}</>;
}
