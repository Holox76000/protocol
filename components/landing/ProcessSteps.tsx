type ProcessStepsProps = {
  steps: string[];
};

export function ProcessSteps({ steps }: ProcessStepsProps) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step} className="card-raise border border-black/20 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-black/60">
              Step {String(index + 1).padStart(2, "0")}
            </p>
            <p className="text-2xl font-display uppercase tracking-[0.2em] text-black/10">
              {String(index + 1).padStart(2, "0")}
            </p>
          </div>
          <p className="mt-4 text-lg font-display font-semibold uppercase tracking-[0.18em] text-black">
            {step}
          </p>
          <div className="mt-4 h-[2px] w-12 bg-black" />
        </div>
      ))}
    </div>
  );
}
