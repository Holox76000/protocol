type Testimonial = {
  quote: string;
  name: string;
  result: string;
  image: string;
};

type TestimonialsProps = {
  items: Testimonial[];
};

export function Testimonials({ items }: TestimonialsProps) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.name} className="card-raise overflow-hidden rounded-2xl border border-black/15 bg-white">
          <div className="aspect-[4/3] w-full border-b border-black/10 bg-black/5">
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-black/60">{item.name}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-black">
              {item.result}
            </p>
            <p className="mt-4 text-sm text-black/70">“{item.quote}”</p>
          </div>
        </div>
      ))}
    </div>
  );
}
