// Client-side image handling. Photos are downscaled and re-encoded in the
// browser, then uploaded to Vercel Blob through /api/uploads. If no Blob store
// is connected yet, the image is saved inline as a data URL instead, which is
// why it still has to stay well under Vercel's 4.5 MB request limit.

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

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Returns a compact version of the image: at most `maxSize` px on the long
 * edge, WebP (or JPEG) encoded. Small files, SVGs and GIFs are kept as-is.
 */
export async function prepareImage(file: File, maxSize = 1600): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("Image must be under 15 MB.");

  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    if (file.size > 1024 * 1024) throw new Error("GIF and SVG images must be under 1 MB.");
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && file.size <= MAX_KEEP_AS_IS_BYTES) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const webp = await canvasToBlob(canvas, "image/webp", 0.82);
    // Browsers without WebP encoding silently return PNG; fall back to JPEG then.
    const encoded = webp?.type === "image/webp" ? webp : await canvasToBlob(canvas, "image/jpeg", 0.85);
    return encoded && encoded.size < file.size ? encoded : file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Prepares and uploads an image, returning the URL to store: a Blob URL, or a
 * data URL when image storage isn't set up yet.
 */
export async function uploadImage(file: File, maxSize = 1600): Promise<string> {
  const image = await prepareImage(file, maxSize);

  const form = new FormData();
  form.append("file", image, file.name);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  if (res.ok) return (await res.json()).url;
  if (res.status === 501) return readAsDataUrl(image);

  const data = await res.json().catch(() => null);
  throw new Error(data?.error || "Could not upload that image.");
}
