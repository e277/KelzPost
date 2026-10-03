import { put } from "@vercel/blob";

// Image storage on Vercel Blob. Until a Blob store is connected to the Vercel
// project, uploads fall back to data URLs saved in the database.

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

export function isAllowedImageType(type: string): boolean {
  return type in EXTENSIONS;
}

/** True when a Blob store is connected (Vercel sets these when you connect one). */
export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

/** Uploads image bytes and returns their public URL. */
export async function storeImage(body: Blob | Buffer, contentType: string): Promise<string> {
  const ext = EXTENSIONS[contentType] ?? "bin";
  const { url } = await put(`images/${crypto.randomUUID()}.${ext}`, body, {
    access: "public",
    contentType,
    // Names are random and never reused, so the files can be cached for a year.
    cacheControlMaxAge: 365 * 24 * 60 * 60,
  });
  return url;
}

const DATA_URL = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i;

/** Uploads an inline `data:image/...;base64,` URL. Returns null for anything else. */
export async function storeDataUrl(dataUrl: string): Promise<string | null> {
  const match = DATA_URL.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  if (!isAllowedImageType(contentType)) return null;
  return storeImage(Buffer.from(match[2], "base64"), contentType);
}
