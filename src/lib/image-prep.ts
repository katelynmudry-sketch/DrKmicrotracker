// Client-side photo preparation shared by the meal-photo upload and the pantry
// photo scan. Re-encodes whatever the picker hands us (including iPhone HEIC,
// which Claude's vision API doesn't accept) into a downscaled JPEG, which also
// keeps the pantry scan's base64 request body well under serverless size limits.

const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.85;

export class ImagePrepError extends Error {
  constructor() {
    // Patient-facing (docs/VOICE.md): uncertain, never blaming.
    super("We couldn't quite read that photo — mind trying another one?");
    this.name = "ImagePrepError";
  }
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap decodes HEIC on the platforms that produce HEIC (WebKit).
  try {
    return await createImageBitmap(file);
  } catch {
    // Older browsers: fall back to an <img> decode.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** Downscale + re-encode a picked photo as JPEG. Throws ImagePrepError if the
 * browser can't decode the file at all (corrupt file, unsupported format). */
export async function prepareImage(file: File): Promise<Blob> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    throw new ImagePrepError();
  }

  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!width || !height) throw new ImagePrepError();

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImagePrepError();
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new ImagePrepError();
  return blob;
}
