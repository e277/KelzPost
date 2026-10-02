// Client-side image preparation. Images are stored inline as data URLs, and
// Vercel limits request bodies to 4.5 MB, so photos are downscaled and
// re-encoded in the browser before being saved.

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_KEEP_AS_IS_BYTES = 400 * 1024;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

/**
 * Returns a compact data URL for the image: at most `maxSize` px on the long
 * edge, WebP (or JPEG) encoded. Small files, SVGs and GIFs are kept as-is.
 */
export async function prepareImage(file: File, maxSize = 1600): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("Image must be under 15 MB.");

  const original = await readAsDataUrl(file);
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    if (file.size > 1024 * 1024) throw new Error("GIF and SVG images must be under 1 MB.");
    return original;
  }

  const img = await loadImage(original);
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && file.size <= MAX_KEEP_AS_IS_BYTES) return original;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const webp = canvas.toDataURL("image/webp", 0.82);
  // Browsers without WebP encoding silently return PNG; fall back to JPEG then.
  const encoded = webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.85);
  return encoded.length < original.length ? encoded : original;
}
