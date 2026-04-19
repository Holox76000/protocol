// Shared design tokens for react-pdf components.
// Mirror the web palette from tailwind.config + ProtocolSidebarLayout.

export const C = {
  void:    "#253239",
  accent:  "#4a7a5e",
  mute:    "#799097",
  dim:     "#4a5c63",
  wire:    "#edf0f1",
  ash:     "#f4f6f7",
  pebble:  "#f6f5f2",
  white:   "#ffffff",
  coverBg: "#1c2a30",
} as const;

export const F = {
  sans:    "Inter",
  serif:   "LibreBaskerville",
  mono:    "Courier",          // react-pdf built-in
  fallback:"Helvetica",        // react-pdf built-in (font CDN fallback)
} as const;

export const PAGE = {
  width:   595.28,             // A4 points
  height:  841.89,
  marginX: 48,
  marginY: 52,
} as const;
