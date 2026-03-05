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
        <div key={item.name} className="card-raise rounded-2xl border border-black/15 bg-white p-6">
          <div className="flex items-center gap-4">
            <img
              src={item.image}
              alt={item.name}
              className="h-12 w-12 rounded-full border border-black/20 object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-black/60">{item.name}</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-black">
                {item.result}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-black/70">“{item.quote}”</p>
        </div>
      ))}
    </div>
  );
}
