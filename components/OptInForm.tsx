import { useState } from "react";
import { COPY } from "../lib/quizConfig";

type OptInFormProps = {
  onSubmit: (email: string) => Promise<void>;
  isSubmitting: boolean;
};

export function OptInForm({ onSubmit, isSubmitting }: OptInFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    const valid = /\S+@\S+\.\S+/.test(trimmed);
    if (!valid) {
      setError("Please enter a valid email.");
      return;
    }
    setError(null);
    await onSubmit(trimmed);
  };

  return (
    <div className="card-raise rounded-3xl border border-black/20 bg-white p-6">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/60">Results Gate</p>
      <h2 className="mt-3 text-2xl font-display font-semibold uppercase tracking-[0.1em] text-black">
        {COPY.optin.title}
      </h2>
      <p className="mt-2 text-base text-black/70">{COPY.optin.sub}</p>
      <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-black/60">
          Where should we send your assessment?
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-black/20 px-4 py-3 text-base text-black focus:border-black"
            required
          />
        </label>
        {error ? <p className="text-sm text-black">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 rounded-2xl bg-black px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black border border-black disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Sending..." : "Send My Results"}
        </button>
      </form>
      <p className="mt-3 text-xs uppercase tracking-[0.3em] text-black/50">
        No spam. Just your diagnostic and the plan.
      </p>
    </div>
  );
}
