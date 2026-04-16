"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  email: string;
  first_name: string;
  protocol_status: string;
  created_at: string;
  submitted_at: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  questionnaire_in_progress: "In progress",
  questionnaire_submitted: "Submitted",
  in_review: "In review",
  delivered: "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-pebble text-dim",
  questionnaire_in_progress: "bg-amber-50 text-amber-700",
  questionnaire_submitted: "bg-amber-50 text-amber-700",
  in_review: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "in_review", label: "In review" },
  { value: "delivered", label: "Delivered" },
];

// 5h refinement window + 2 days review + 3 days delivery = 125 hours
const DELIVERY_DEADLINE_MS = 125 * 60 * 60 * 1000;

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dueDate(submittedAt: string | null): Date | null {
  if (!submittedAt) return null;
  return new Date(new Date(submittedAt).getTime() + DELIVERY_DEADLINE_MS);
}

function DueBadge({ submittedAt, status }: { submittedAt: string | null; status: string }) {
  if (status === "delivered" || !submittedAt) return <span className="text-[13px] text-mute">—</span>;

  const due = dueDate(submittedAt)!;
  const now = Date.now();
  const msLeft = due.getTime() - now;
  const hoursLeft = Math.floor(msLeft / (60 * 60 * 1000));

  const label = fmt(due.toISOString());

  if (msLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        {label} · Overdue
      </span>
    );
  }
  if (hoursLeft < 48) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        {label} · {hoursLeft}h left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-dim">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {label}
    </span>
  );
}

export default function OrderListClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const visible = orders.filter((o) => {
    if (filter !== "all" && o.protocol_status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.email.toLowerCase().includes(q) || o.first_name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-wire bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-wire px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filters */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                filter === f.value
                  ? "bg-void text-white"
                  : "bg-pebble text-dim hover:bg-ash"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-wire bg-ash px-3 py-2 text-[13px] text-void placeholder:text-mute focus:border-void focus:outline-none sm:w-56"
        />
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="px-5 py-12 text-center text-[13px] text-mute">No orders found.</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-wire">
              {["Client", "Email", "Status", "Signed up", "Submitted", "Due by"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-mute"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((o, i) => (
              <tr
                key={o.id}
                onClick={() => router.push(`/admin/orders/${o.id}`)}
                className={`cursor-pointer transition-colors hover:bg-ash ${
                  i !== visible.length - 1 ? "border-b border-wire" : ""
                }`}
              >
                <td className="px-5 py-3.5 text-[13px] font-medium text-void">{o.first_name}</td>
                <td className="px-5 py-3.5 text-[13px] text-dim">{o.email}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${STATUS_COLORS[o.protocol_status] ?? "bg-pebble text-dim"}`}
                  >
                    {STATUS_LABELS[o.protocol_status] ?? o.protocol_status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[13px] text-dim">{fmt(o.created_at)}</td>
                <td className="px-5 py-3.5 text-[13px] text-dim">{fmt(o.submitted_at)}</td>
                <td className="px-5 py-3.5">
                  <DueBadge submittedAt={o.submitted_at} status={o.protocol_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
