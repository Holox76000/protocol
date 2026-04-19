import { Font } from "@react-pdf/renderer";

let registered = false;

// jsDelivr + fontsource — stable, no license issues, direct woff2 URLs.
const CDN = "https://cdn.jsdelivr.net/npm/@fontsource";

export function registerFonts() {
  if (registered) return;
  registered = true;

  try {
    Font.register({
      family: "Inter",
      fonts: [
        { src: `${CDN}/inter@5.0.16/files/inter-latin-400-normal.woff2`, fontWeight: 400 },
        { src: `${CDN}/inter@5.0.16/files/inter-latin-500-normal.woff2`, fontWeight: 500 },
        { src: `${CDN}/inter@5.0.16/files/inter-latin-600-normal.woff2`, fontWeight: 600 },
      ],
    });

    Font.register({
      family: "LibreBaskerville",
      fonts: [
        { src: `${CDN}/libre-baskerville@5.0.5/files/libre-baskerville-latin-400-normal.woff2`, fontWeight: 400 },
        { src: `${CDN}/libre-baskerville@5.0.5/files/libre-baskerville-latin-400-italic.woff2`, fontWeight: 400, fontStyle: "italic" },
      ],
    });
  } catch {
    // If CDN is unreachable, react-pdf falls back to Helvetica automatically.
  }
}
