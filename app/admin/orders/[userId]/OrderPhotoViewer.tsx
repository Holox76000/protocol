"use client";

type Photos = {
  front: string | null;
  side: string | null;
  back: string | null;
  face: string | null;
};

function PhotoSlot({ url, label }: { url: string | null; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-wire">
      <p className="border-b border-wire bg-ash px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-mute">
        {label}
      </p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            className="h-64 w-full object-cover transition-opacity hover:opacity-90"
          />
        </a>
      ) : (
        <div className="flex h-64 items-center justify-center bg-pebble">
          <p className="text-[12px] text-mute">No photo</p>
        </div>
      )}
    </div>
  );
}

export default function OrderPhotoViewer({ photos }: { photos: Photos }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <PhotoSlot url={photos.front} label="Front" />
      <PhotoSlot url={photos.side} label="Side" />
      <PhotoSlot url={photos.back} label="Back" />
      <PhotoSlot url={photos.face} label="Face" />
    </div>
  );
}
