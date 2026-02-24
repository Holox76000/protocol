type MarqueeProps = {
  items: string[];
};

export function Marquee({ items }: MarqueeProps) {
  const content = items.join(" • ");
  return (
    <div className="marquee-mask mt-16 overflow-hidden border-y border-black/10 bg-white py-4">
      <div className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.45em] text-black/70 marquee">
        <span className="mr-10">{content}</span>
        <span className="mr-10">{content}</span>
      </div>
    </div>
  );
}
