type StatListProps = {
  items: string[];
};

export function StatList({ items }: StatListProps) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={item}
          className="card-raise flex items-start gap-4 rounded-2xl border border-black/15 bg-white p-5"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60">
            {String(index + 1).padStart(2, "0")}
          </div>
          <div className="text-base text-black/80">{item}</div>
        </div>
      ))}
    </div>
  );
}
