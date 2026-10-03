// Comment rules shared by the API and the comment form (no database access, so it is safe in the browser).

export const COMMENT_STATUSES = ["pending", "approved", "spam"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const COMMENT_LIMITS = { name: 60, email: 200, content: 3000 } as const;

export function isCommentStatus(value: unknown): value is CommentStatus {
  return typeof value === "string" && (COMMENT_STATUSES as readonly string[]).includes(value);
}

export type CommentInput = { name: string; email: string; content: string };

/** Validates a visitor's comment form; returns the cleaned values or an error message. */
export function parseCommentInput(body: Record<string, unknown>): CommentInput | { error: string } {
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  // Keep the commenter's line breaks, but no runs of blank lines.
  const content = typeof body.content === "string" ? body.content.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim() : "";

  if (!name) return { error: "Please add your name." };
  if (name.length > COMMENT_LIMITS.name) return { error: `Names can be up to ${COMMENT_LIMITS.name} characters.` };
  if (email && (email.length > COMMENT_LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: "That email address doesn't look right." };
  }
  if (!content) return { error: "Please write a comment." };
  if (content.length > COMMENT_LIMITS.content) return { error: `Comments can be up to ${COMMENT_LIMITS.content} characters.` };
  return { name, email, content };
}

/** Comments stuffed with links are almost always spam. */
export function looksLikeSpam(content: string): boolean {
  return (content.match(/https?:\/\/|www\./gi) || []).length > 2;
}
