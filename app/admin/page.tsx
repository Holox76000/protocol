import { getAdminStats } from "../../lib/adminStats";

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <main className="bg-white text-black min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-display font-semibold uppercase tracking-[0.2em]">
          Quiz Analytics
        </h1>
        <p className="mt-4 text-sm text-black/60">
          Local database snapshot. Counts are unique sessions per step/event.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <div className="card-raise rounded-2xl border border-black/20 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-black/60">Started</p>
            <p className="mt-3 text-3xl font-display font-semibold text-black">{stats.started}</p>
          </div>
          <div className="card-raise rounded-2xl border border-black/20 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-black/60">Opt-In Viewed</p>
            <p className="mt-3 text-3xl font-display font-semibold text-black">{stats.optinViewed}</p>
          </div>
          <div className="card-raise rounded-2xl border border-black/20 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-black/60">Lead Submitted</p>
            <p className="mt-3 text-3xl font-display font-semibold text-black">{stats.leadSubmitted}</p>
          </div>
          <div className="card-raise rounded-2xl border border-black/20 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-black/60">Result Viewed</p>
            <p className="mt-3 text-3xl font-display font-semibold text-black">{stats.resultViewed}</p>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-display font-semibold uppercase tracking-[0.2em]">Step Funnel</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {stats.steps.map((step) => (
              <div key={step.label} className="rounded-2xl border border-black/15 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-black/60">{step.label}</p>
                <p className="mt-2 text-2xl font-display font-semibold text-black">{step.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
