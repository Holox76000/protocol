type ColumnItem = {
  title: string;
  body: string;
};

type ThreeColumnProps = {
  items: ColumnItem[];
};

export function ThreeColumn({ items }: ThreeColumnProps) {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-3">
      {items.map((item, index) => (
        <div
          key={item.title}
          className="card-raise border border-black/20 bg-white p-6"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-black/60">
            Cause {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.3em] text-black">
            {item.title}
          </h3>
          <p className="mt-4 text-base text-black/75">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
