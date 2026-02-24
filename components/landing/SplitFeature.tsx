type SplitFeatureProps = {
  title: string;
  body: string;
  image: string;
  flipped?: boolean;
  tone?: "light" | "dark";
};

export function SplitFeature({
  title,
  body,
  image,
  flipped = false,
  tone = "dark"
}: SplitFeatureProps) {
  const isDark = tone === "dark";
  return (
    <div className={`grid items-center gap-8 md:grid-cols-2 ${flipped ? "md:flex-row-reverse" : ""}`.trim()}>
      <div className={flipped ? "md:order-2" : ""}>
        <p className={`text-xs uppercase tracking-[0.45em] ${isDark ? "text-white/70" : "text-black/60"}`}>
          Protocol Method
        </p>
        <h3 className="mt-4 text-2xl font-display font-semibold uppercase tracking-[0.18em]">
          {title}
        </h3>
        <p className={`mt-4 text-base ${isDark ? "text-white/70" : "text-black/70"}`}>{body}</p>
      </div>
      <div
        className={`card-raise overflow-hidden rounded-3xl border border-black/15 bg-white ${
          flipped ? "md:order-1" : ""
        }`}
      >
        <div className="aspect-[4/3] w-full">
          <img
            src={image}
            alt="Marble statue"
            className="h-full w-full object-cover grayscale object-[center_34%]"
          />
        </div>
      </div>
    </div>
  );
}
