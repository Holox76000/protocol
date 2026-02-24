type MarbleGalleryProps = {
  images: string[];
};

export function MarbleGallery({ images }: MarbleGalleryProps) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-3">
      {images.map((src, index) => (
        <div
          key={src}
          className={`card-raise overflow-hidden rounded-3xl border border-black/15 bg-white ${
            index === 1 ? "md:translate-y-6" : ""
          }`}
        >
          <div className="aspect-[4/5] w-full">
            <img
              src={src}
              alt="Marble statue detail"
              className="h-full w-full object-cover grayscale"
              loading="lazy"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
