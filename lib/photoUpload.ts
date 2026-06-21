import "server-only";
import sharp from "sharp";
import heicConvert from "heic-convert";

export type NormalizedPhoto = {
  buffer: Buffer;
  contentType: "image/jpeg" | "image/png";
  ext: "jpg" | "png";
};

const HEIF_BRANDS = new Set([
  "heic", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1",
]);

function isHeif(buffer: Buffer, mimeType: string): boolean {
  if (/heic|heif/i.test(mimeType)) return true;
  // ISO BMFF: bytes 4..8 are 'ftyp', then 4-char major brand
  if (buffer.length < 12) return false;
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buffer.toString("ascii", 8, 12).toLowerCase();
  return HEIF_BRANDS.has(brand);
}

export async function normalizePhotoForStorage(
  buffer: Buffer,
  mimeType: string
): Promise<NormalizedPhoto> {
  let working = buffer;

  if (isHeif(buffer, mimeType)) {
    const decoded = await heicConvert({ buffer, format: "JPEG", quality: 0.9 });
    working = Buffer.from(decoded);
  }

  // sharp() handles JPEG/PNG natively. .rotate() bakes EXIF orientation
  // into pixels so browser <img> tags render upright.
  const img = sharp(working).rotate();
  const meta = await img.metadata();

  if (meta.format === "png") {
    const out = await img.png().toBuffer();
    return { buffer: out, contentType: "image/png", ext: "png" };
  }

  const out = await img.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  return { buffer: out, contentType: "image/jpeg", ext: "jpg" };
}
