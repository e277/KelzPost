import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, subscribers } from "@/db";
import { isMailerConfigured } from "@/lib/mailer";
import { newToken, normalizeEmail, sendConfirmationEmail } from "@/lib/newsletter";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/site";

const MAX_SIGNUPS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const CHECK_INBOX = "Almost done! Check your inbox and click the link to confirm.";

/** Public signup: { email }. Sends a confirmation link; the address is only emailed posts once confirmed. */
export async function POST(req: NextRequest) {
  if (!isMailerConfigured()) {
    return NextResponse.json({ error: "The newsletter isn't available right now." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  // Hidden field that people never see; bots that fill every input get a quiet success.
  if (body.website) return NextResponse.json({ message: CHECK_INBOX });

  const email = normalizeEmail(body.email);
  if (!email) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

  const limit = await rateLimit(`newsletter:${clientIp(req.headers)}`, MAX_SIGNUPS, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many signups from your connection. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const existing = await db.query.subscribers.findFirst({ where: eq(subscribers.email, email) });
  // Already confirmed: answer the same way so the form doesn't reveal who is subscribed.
  if (existing?.status === "active") return NextResponse.json({ message: CHECK_INBOX });

  const token = newToken();
  if (existing) {
    await db.update(subscribers).set({ status: "pending", token }).where(eq(subscribers.id, existing.id));
  } else {
    await db.insert(subscribers).values({ email, token }).onConflictDoUpdate({
      target: subscribers.email,
      set: { token },
    });
  }

  try {
    await sendConfirmationEmail(await getSettings(), email, token);
  } catch (err) {
    console.error("Newsletter confirmation email failed:", err);
    return NextResponse.json({ error: "We couldn't send the confirmation email. Please try again later." }, { status: 502 });
  }

  return NextResponse.json({ message: CHECK_INBOX });
}
