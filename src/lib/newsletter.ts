import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db, posts, subscribers, type Post, type Settings } from "@/db";
import { sendMail } from "@/lib/mailer";
import { absoluteUrl } from "@/lib/site";
import { escapeXml, summarize } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lower-cased, trimmed address, or null when it doesn't look like an email. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

const confirmUrl = (token: string) => absoluteUrl(`/newsletter/confirm?token=${encodeURIComponent(token)}`);
const unsubscribeUrl = (token: string) => absoluteUrl(`/newsletter/unsubscribe?token=${encodeURIComponent(token)}`);
const oneClickUnsubscribeUrl = (token: string) => absoluteUrl(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`);

/** Wraps email body HTML in a simple, widely supported table layout. */
function layout(settings: Settings, body: string, footer: string): string {
  const accent = escapeXml(settings.accentColor || "#C8922A");
  const navy = escapeXml(settings.navyColor || "#0A1F44");
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e6ea;">
<tr><td style="background:${navy};padding:20px 28px;font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#ffffff;">
${escapeXml(settings.blogTitle)}<span style="color:${accent};">.</span>
</td></tr>
<tr><td style="padding:28px;">${body}</td></tr>
</table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#9aa5b4;">${footer}</p>
</td></tr>
</table>
</body></html>`;
}

function button(settings: Settings, href: string, label: string): string {
  const accent = escapeXml(settings.accentColor || "#C8922A");
  return `<a href="${escapeXml(href)}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:6px;">${escapeXml(label)}</a>`;
}

/** Sends the double opt-in email that activates a new signup. */
export async function sendConfirmationEmail(settings: Settings, email: string, token: string): Promise<void> {
  const link = confirmUrl(token);
  const body = `
<h1 style="font-family:Georgia,serif;font-size:24px;color:#0A1F44;margin:0 0 12px;">Confirm your subscription</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Thanks for signing up for ${escapeXml(settings.blogTitle)}. Click the button below to start getting new posts by email.</p>
${button(settings, link, "Confirm subscription")}
<p style="font-size:13px;line-height:1.6;color:#4a5568;margin:24px 0 0;">Or paste this link into your browser:<br><a href="${escapeXml(link)}" style="color:#4a5568;word-break:break-all;">${escapeXml(link)}</a></p>`;

  await sendMail({
    to: email,
    subject: `Confirm your subscription to ${settings.blogTitle}`,
    html: layout(settings, body, "If you didn't sign up, ignore this email and you won't hear from us again."),
    text: `Thanks for signing up for ${settings.blogTitle}.\n\nConfirm your subscription here:\n${link}\n\nIf you didn't sign up, ignore this email.`,
  });
}

function postEmail(settings: Settings, post: Post, token: string) {
  const url = absoluteUrl(`/post/${post.slug}`);
  const summary = summarize(post.excerpt, post.content, 300);
  const unsubscribe = unsubscribeUrl(token);
  // Data-URL images are blocked by most mail clients, so only hosted covers are included.
  const cover = post.coverImage && !post.coverImage.startsWith("data:") ? post.coverImage : "";
  const author = post.author || settings.authorName;

  const body = `
${cover ? `<a href="${escapeXml(url)}"><img src="${escapeXml(cover)}" alt="" width="504" style="display:block;width:100%;max-width:504px;height:auto;border-radius:8px;margin:0 0 20px;"></a>` : ""}
<p style="font-size:12px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;color:#9aa5b4;margin:0 0 8px;">New post${author ? ` by ${escapeXml(author)}` : ""}</p>
<h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#0A1F44;margin:0 0 14px;"><a href="${escapeXml(url)}" style="color:#0A1F44;text-decoration:none;">${escapeXml(post.title)}</a></h1>
${summary ? `<p style="font-size:15px;line-height:1.6;color:#4a5568;margin:0 0 24px;">${escapeXml(summary)}</p>` : ""}
${button(settings, url, "Read the full post")}`;

  return {
    subject: post.title,
    html: layout(
      settings,
      body,
      `You're getting this because you subscribed to ${escapeXml(settings.blogTitle)}. <a href="${escapeXml(unsubscribe)}" style="color:#9aa5b4;">Unsubscribe</a>`
    ),
    text: `New post: ${post.title}\n\n${summary}\n\nRead it here: ${url}\n\n—\nUnsubscribe: ${unsubscribe}`,
    headers: {
      // Lets mail apps show their own one-click "Unsubscribe" button (RFC 8058).
      "List-Unsubscribe": `<${oneClickUnsubscribeUrl(token)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export type SendResult =
  | { ok: true; sent: number; failed: number }
  | { ok: false; error: string; status: number };

/**
 * Emails a live post to every confirmed subscriber, once. The post is claimed
 * before sending so a double click can't send it twice; if nothing could be
 * delivered (for example, wrong SMTP password) the claim is released so it can
 * be retried.
 */
export async function sendPostToSubscribers(settings: Settings, postId: string): Promise<SendResult> {
  const [post] = await db
    .update(posts)
    .set({ newsletterSentAt: new Date() })
    .where(and(eq(posts.id, postId), isNull(posts.newsletterSentAt)))
    .returning();
  if (!post) {
    const exists = await db.query.posts.findFirst({ where: eq(posts.id, postId), columns: { id: true } });
    return exists
      ? { ok: false, error: "This post was already sent to subscribers.", status: 409 }
      : { ok: false, error: "Post not found.", status: 404 };
  }

  const release = () => db.update(posts).set({ newsletterSentAt: null }).where(eq(posts.id, postId));

  if (post.status !== "published" || !post.publishedAt || post.publishedAt > new Date()) {
    await release();
    return { ok: false, error: "Only live posts can be sent. Publish it first, or wait until its scheduled time.", status: 400 };
  }

  const readers = await db
    .select({ email: subscribers.email, token: subscribers.token })
    .from(subscribers)
    .where(eq(subscribers.status, "active"));
  if (readers.length === 0) {
    await release();
    return { ok: false, error: "There are no confirmed subscribers yet.", status: 400 };
  }

  let sent = 0;
  let failed = 0;
  let firstError = "";
  for (const reader of readers) {
    try {
      await sendMail({ to: reader.email, ...postEmail(settings, post, reader.token) });
      sent++;
    } catch (err) {
      failed++;
      firstError ||= err instanceof Error ? err.message : String(err);
    }
  }

  if (sent === 0) {
    await release();
    return { ok: false, error: `No emails could be sent: ${firstError}`, status: 502 };
  }
  return { ok: true, sent, failed };
}

/**
 * Activates a pending signup from its email link. An address that later
 * unsubscribed stays unsubscribed even if the old link is clicked again.
 */
export async function confirmSubscription(token: string): Promise<"confirmed" | "unsubscribed" | "invalid"> {
  if (!token) return "invalid";
  const row = await db.query.subscribers.findFirst({ where: eq(subscribers.token, token) });
  if (!row) return "invalid";
  if (row.status === "unsubscribed") return "unsubscribed";
  if (row.status === "pending") {
    await db.update(subscribers).set({ status: "active", confirmedAt: new Date() }).where(eq(subscribers.id, row.id));
  }
  return "confirmed";
}

/** Marks a subscriber as unsubscribed. Returns false for an unknown token. */
export async function unsubscribe(token: string): Promise<boolean> {
  if (!token) return false;
  const rows = await db
    .update(subscribers)
    .set({ status: "unsubscribed" })
    .where(eq(subscribers.token, token))
    .returning({ id: subscribers.id });
  return rows.length > 0;
}
