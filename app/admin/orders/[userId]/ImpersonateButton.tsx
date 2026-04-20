"use client";

import { useState } from "react";

export default function ImpersonateButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${userId}/impersonate`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        window.location.href = data.redirectTo;
      } else {
        alert(data.error ?? "Impersonation failed");
        setLoading(false);
      }
    } catch {
      alert("Request failed");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-wire bg-white px-3.5 py-2 text-[12px] font-semibold text-void transition-colors hover:border-void hover:bg-ash disabled:opacity-50"
    >
      {loading ? "…" : "Login as client"}
    </button>
  );
}
