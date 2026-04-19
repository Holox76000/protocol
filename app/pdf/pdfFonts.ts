import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

// Local font files (public/fonts/) — downloaded from fontsource CDN at build time.
// CDN fetching triggered fontkit's TrueType composite-glyph encoder to overflow
// a DataView when subsetting large documents; local binary files are stable.
function fontPath(file: string): string {
  return path.join(process.cwd(), "public", "fonts", file);
}

export function registerFonts() {
  if (registered) return;
  registered = true;

  try {
    Font.register({
      family: "Inter",
      fonts: [
        { src: fontPath("inter-400.woff"), fontWeight: 400 },
        { src: fontPath("inter-500.woff"), fontWeight: 500 },
        { src: fontPath("inter-600.woff"), fontWeight: 600 },
      ],
    });

    Font.register({
      family: "LibreBaskerville",
      fonts: [
        { src: fontPath("libre-400.woff"),  fontWeight: 400 },
        { src: fontPath("libre-400i.woff"), fontWeight: 400, fontStyle: "italic" },
      ],
    });
  } catch {
    // Fall back to Helvetica if font files are missing.
  }
}
