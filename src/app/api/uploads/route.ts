import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { MAX_UPLOAD_BYTES, blobConfigured, isAllowedImageType, storeImage } from "@/lib/blob";

export async function POST(req: NextRequest) {
  const { error } = await requireUser();
  if (error) return error;

  // The editor falls back to saving the image inside the post when this is 501.
  if (!blobConfigured()) {
    return NextResponse.json({ error: "Image storage is not set up." }, { status: 501 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file was sent." }, { status: 400 });
  const type = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (!isAllowedImageType(type)) {
    return NextResponse.json({ error: "Please upload a JPG, PNG, WEBP, GIF, AVIF or SVG image." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Image must be under 4 MB." }, { status: 413 });

  try {
    const url = await storeImage(file, type);
    return NextResponse.json({ url });
  } catch (e) {
    // Most often the Blob store is misconfigured. The upload still works: the
    // editor saves the image inside the post, and /api/health shows the problem.
    console.error("Image upload to Vercel Blob failed", e);
    return NextResponse.json({ error: "Image storage failed.", fallback: true }, { status: 502 });
  }
}
