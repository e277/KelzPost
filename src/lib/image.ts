// Client-side image handling. Photos are downscaled and re-encoded in the
// browser, then uploaded to Vercel Blob through /api/uploads. If no Blob store
// is connected yet, the image is saved inline as a data URL instead, which is
// why it still has to stay well under Vercel's 4.5 MB request limit.

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_KEEP_AS_IS_BYTES = 400 * 1024;

// Some systems hand over files without a MIME type, so the extension is used then.
const TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
};

/** The file's image type, from its MIME type or else its extension; "" if it isn't an image. */
export function imageType(file: File): string {
  if (file.type.startsWith("image/")) return file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (file.type) return "";
  return TYPES_BY_EXTENSION[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "";
}

export const isImageFile = (file: File) => imageType(file) !== "";

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
  const type = imageType(file);
  if (!type) throw new Error("Please select an image file.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("Image must be under 15 MB.");
  // Re-label files that arrived without a usable type so the server accepts them.
  const original = type === file.type ? file : new Blob([file], { type });

  if (type === "image/svg+xml" || type === "image/gif") {
    if (file.size > 1024 * 1024) throw new Error("GIF and SVG images must be under 1 MB.");
    return original;
  }

  const objectUrl = URL.createObjectURL(original);
  try {
    const img = await loadImage(objectUrl).catch(() => {
      throw new Error(
        type === "image/heic" || type === "image/heif"
          ? "This browser can't read HEIC photos. Please save it as a JPG or PNG first."
          : "Could not read that image."
      );
    });
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    // HEIC can't be shown on most browsers, so it is always converted.
    const keepable = type !== "image/heic" && type !== "image/heif";
    if (scale === 1 && file.size <= MAX_KEEP_AS_IS_BYTES && keepable) return original;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const webp = await canvasToBlob(canvas, "image/webp", 0.82);
    // Browsers without WebP encoding silently return PNG; fall back to JPEG then.
    const encoded = webp?.type === "image/webp" ? webp : await canvasToBlob(canvas, "image/jpeg", 0.85);
    return encoded && (encoded.size < file.size || !keepable) ? encoded : original;
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
  let res: Response;
  try {
    res = await fetch("/api/uploads", { method: "POST", body: form });
  } catch {
    throw new Error("Could not reach the server to upload that image. Check your connection and try again.");
  }
  // Vercel answers some failures (like an oversized request) with plain text, not JSON.
  const data: { url?: string; error?: string; fallback?: boolean } | null = await res.json().catch(() => null);
  if (res.ok && data?.url) return data.url;
  // No image storage, or it failed: keep the image inside the post instead.
  if (res.status === 501 || data?.fallback) return readAsDataUrl(image);
  if (res.status === 401) throw new Error("Your session has ended. Please sign in again, then upload the image.");
  if (res.status === 413) throw new Error("That image is too large to upload. Please use a smaller one.");
  throw new Error(data?.error || `Could not upload that image (error ${res.status}).`);
}
