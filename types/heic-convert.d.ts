declare module "heic-convert" {
  type Format = "JPEG" | "PNG";
  type Options = {
    buffer: Buffer | ArrayBuffer | Uint8Array;
    format: Format;
    quality?: number;
  };
  function heicConvert(opts: Options): Promise<ArrayBuffer>;
  export default heicConvert;
}
