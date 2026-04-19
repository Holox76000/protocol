export const runtime = "nodejs";

type Category = "promoter" | "passive" | "detractor";

const MESSAGES: Record<Category, { heading: string; body: string; icon: string }> = {
  promoter: {
    icon: "✦",
    heading: "Thank you — that means a lot.",
    body: "You're exactly the kind of client we build for. If you'd like to share your experience with someone who could benefit, we'd be honoured.",
  },
  passive: {
    icon: "→",
    heading: "Thanks for the honest feedback.",
    body: "We read every response. What you shared will directly shape the next version of the protocol. We're working on getting this right.",
  },
  detractor: {
    icon: "↗",
    heading: "Thanks for telling us.",
    body: "We're sorry it didn't meet your expectations. Your answers will be reviewed personally. If you'd like to discuss it further, reply to any of our emails.",
  },
};

export default function NpsThanksPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = (searchParams.category ?? "passive") as Category;
  const msg = MESSAGES[category] ?? MESSAGES.passive;

  const iconColor =
    category === "promoter" ? "#4a7a5e" :
    category === "passive"  ? "#7a6a2e" : "#515255";

  return (
    <main style={{ minHeight: "100vh", background: "#f9fbfb", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <p style={{ margin: "0 0 24px", fontSize: 28, color: iconColor }}>{msg.icon}</p>
        <h1 style={{ margin: "0 0 16px", fontSize: 26, fontWeight: 400, color: "#253239", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
          {msg.heading}
        </h1>
        <p style={{ margin: "0 0 32px", fontSize: 15, color: "#515255", lineHeight: 1.7 }}>
          {msg.body}
        </p>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#7f949b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Protocol Club
        </p>
      </div>
    </main>
  );
}
