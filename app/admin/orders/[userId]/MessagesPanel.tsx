"use client";

import { useState, useRef, useEffect } from "react";

export type Message = {
  id: string;
  direction: "outbound" | "inbound";
  body: string;
  created_at: string;
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MessagesPanel({
  userId,
  initialMessages,
}: {
  userId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody]         = useState("");
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${userId}/message`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ body: text }),
      });
      const d = await res.json() as { ok?: boolean; message?: Message | null; error?: string };
      if (!res.ok) { setError(d.error ?? "Failed to send."); return; }
      if (d.message) setMessages((prev) => [...prev, d.message!]);
      setBody("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
  };

  return (
    <div>
      <h3 className="mb-4 border-b border-wire pb-2 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-void">
        Messages
      </h3>

      {/* Thread */}
      <div className="mb-4 flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="py-4 text-center text-[12px] text-mute">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col gap-1 ${m.direction === "outbound" ? "items-end" : "items-start"}`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                {m.direction === "outbound" ? "You" : "Client"}
              </span>
              <div className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                m.direction === "outbound"
                  ? "bg-void text-white"
                  : "border border-wire bg-ash text-void"
              }`}>
                {m.body}
              </div>
              <span className="text-[10px] text-mute">{fmt(m.created_at)}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</p>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Write a message to the client…"
        className="w-full resize-none rounded-lg border border-wire bg-ash px-3 py-2.5 text-[13px] text-void placeholder:text-mute focus:border-void focus:bg-white focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[10px] text-mute">⌘ Enter to send</p>
        <button
          onClick={handleSend}
          disabled={!body.trim() || sending}
          className="flex items-center gap-2 rounded-lg bg-void px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1a1b] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white" />
              Sending…
            </>
          ) : "Send"}
        </button>
      </div>
    </div>
  );
}
