type MetricItem = {
  value: string;
  label: string;
};

type MetricRailProps = {
  items: MetricItem[];
};

export function MetricRail({ items }: MetricRailProps) {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="card-raise rounded-2xl border border-black/20 bg-white p-5 text-center"
        >
          <p className="text-3xl font-display font-semibold uppercase tracking-[0.2em] text-black">
            {item.value}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-black/60">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
