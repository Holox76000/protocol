type Testimonial = {
  quote: string;
  name: string;
  result: string;
};

type TestimonialsProps = {
  items: Testimonial[];
};

export function Testimonials({ items }: TestimonialsProps) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.name} className="card-raise rounded-2xl border border-black/15 bg-white p-6">
          <p className="text-sm text-black/70">“{item.quote}”</p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-black/60">{item.name}</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-black">
            {item.result}
          </p>
        </div>
      ))}
    </div>
  );
}
