import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, blobConfigured, isAllowedImageType, storeImage } from "@/lib/blob";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // The editor falls back to saving the image inside the post when this is 501.
  if (!blobConfigured()) {
    return NextResponse.json({ error: "Image storage is not set up." }, { status: 501 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file was sent." }, { status: 400 });
  if (!isAllowedImageType(file.type)) {
    return NextResponse.json({ error: "Please upload a JPG, PNG, WEBP, GIF, AVIF or SVG image." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Image must be under 4 MB." }, { status: 413 });

  try {
    const url = await storeImage(file, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("Image upload failed", e);
    return NextResponse.json({ error: "The image could not be uploaded. Please try again." }, { status: 502 });
  }
}
