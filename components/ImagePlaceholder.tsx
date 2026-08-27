"use client";

// Marks a visual that is currently a CSS/SVG mock-up and must be swapped for a
// real image (screenshot, photo, example render) before a paid launch.
//
// Usage: add the `img-ph-slot` class to the (position-relative) container that
// holds the mock-up, then drop <PlaceholderRibbon note="..." /> inside it. The
// styles live in app/dating/dating.css (imported by every experiment landing).

export function PlaceholderRibbon({ note }: { note?: string }) {
  return (
    <span
      className="img-ph-ribbon"
      title={note ? `Replace with a real image: ${note}` : "Replace with a real image"}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
        <path d="M4 17l4.5-4.5 3 3L15 12l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Placeholder image
    </span>
  );
}
