type WhoForProps = {
  forItems: string[];
  notForItems: string[];
};

export function WhoFor({ forItems, notForItems }: WhoForProps) {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <div className="card-raise rounded-3xl border border-black/20 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-black">For You If</h3>
        <div className="mt-6 grid gap-3">
          {forItems.map((item) => (
            <div key={item} className="border-l-2 border-black/70 pl-4 text-base text-black/80">
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="card-raise rounded-3xl border border-black/20 bg-black text-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">Not For You If</h3>
        <div className="mt-6 grid gap-3">
          {notForItems.map((item) => (
            <div key={item} className="border-l-2 border-white/60 pl-4 text-base text-white/80">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
