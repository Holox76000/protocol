type FAQItem = {
  question: string;
  answer: string;
};

type FAQProps = {
  items: FAQItem[];
};

export function FAQ({ items }: FAQProps) {
  return (
    <div className="mt-10 grid gap-4">
      {items.map((item) => (
        <details key={item.question} className="card-raise border border-black/20 bg-white p-5">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.2em] text-black">
            {item.question}
          </summary>
          <p className="mt-3 text-base text-black/70">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
