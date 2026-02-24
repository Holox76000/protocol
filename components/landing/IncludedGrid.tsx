type IncludedGridProps = {
  items: string[];
};

export function IncludedGrid({ items }: IncludedGridProps) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <div
          key={item}
          className="card-raise rounded-2xl border border-black/20 bg-white px-5 py-6"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            Included {String(index + 1).padStart(2, "0")}
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-black">{item}</p>
        </div>
      ))}
    </div>
  );
}
