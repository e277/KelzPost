import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isMailerConfigured, missingMailerSettings } from "@/lib/mailer";
import { sendPostToSubscribers } from "@/lib/newsletter";
import { getSettings } from "@/lib/site";

// Sending goes one email at a time; allow enough time for a few thousand readers.
export const maxDuration = 300;

/** Emails a live post to confirmed subscribers: { postId }. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isMailerConfigured()) {
    return NextResponse.json({ error: `Email isn't set up yet. Missing: ${missingMailerSettings().join(", ")}.` }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  if (typeof body.postId !== "string" || !body.postId) {
    return NextResponse.json({ error: "postId is required." }, { status: 400 });
  }

  const result = await sendPostToSubscribers(await getSettings(), body.postId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ sent: result.sent, failed: result.failed });
}
