"use client";

import { useState, type FormEvent } from "react";
import { COMMENT_LIMITS } from "@/lib/comments";

/** A comment as sent to the browser: never includes the commenter's email. */
export type PublicComment = {
  id: string;
  authorName: string;
  content: string;
  isAuthor: boolean;
  date: string;
  iso: string;
  replies?: PublicComment[];
};

function CommentForm({ postId, parentId, onCancel }: { postId: string; parentId?: string; onCancel?: () => void }) {
  const [startedAt] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, postId, parentId, startedAt }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Your comment couldn't be sent. Please try again.");
      } else {
        form.reset();
        setSent(true);
      }
    } catch {
      setError("Your comment couldn't be sent. Check your connection and try again.");
    }
    setBusy(false);
  };

  if (sent) {
    return (
      <p className="comment-form__sent" role="status">
        Thanks! Your comment will appear once it has been approved.
        {onCancel && (
          <button type="button" className="link-btn" onClick={onCancel}>
            Close
          </button>
        )}
      </p>
    );
  }

  const idPrefix = parentId ? `reply-${parentId}` : "comment";

  return (
    <form className="comment-form" onSubmit={submit}>
      <div className="comment-form__row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-name`}>Name</label>
          <input id={`${idPrefix}-name`} name="name" required maxLength={COMMENT_LIMITS.name} autoComplete="name" />
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-email`}>
            Email <span className="comment-form__optional">(optional, never shown)</span>
          </label>
          <input id={`${idPrefix}-email`} name="email" type="email" maxLength={COMMENT_LIMITS.email} autoComplete="email" />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-content`}>{parentId ? "Your reply" : "Comment"}</label>
        <textarea id={`${idPrefix}-content`} name="content" required rows={parentId ? 3 : 5} maxLength={COMMENT_LIMITS.content} />
      </div>
      {/* Hidden from people; bots that fill it in are ignored. */}
      <div className="comment-form__hp" aria-hidden="true">
        <label htmlFor={`${idPrefix}-website`}>Website</label>
        <input id={`${idPrefix}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && (
        <p className="comment-form__error" role="alert">
          {error}
        </p>
      )}
      <div className="comment-form__actions">
        <button type="submit" className="btn btn--primary btn--sm" disabled={busy}>
          {busy ? "Sending…" : parentId ? "Post reply" : "Post comment"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
            Cancel
          </button>
        )}
        <span className="comment-form__note">Comments are reviewed before they appear.</span>
      </div>
    </form>
  );
}

function CommentItem({ comment, onReply }: { comment: PublicComment; onReply?: () => void }) {
  return (
    <div className="comment">
      <div className={`comment__avatar${comment.isAuthor ? " comment__avatar--author" : ""}`} aria-hidden="true">
        {comment.authorName[0]?.toUpperCase() || "?"}
      </div>
      <div className="comment__main">
        <div className="comment__meta">
          <strong className="comment__name">{comment.authorName}</strong>
          {comment.isAuthor && <span className="badge badge--navy comment__badge">Author</span>}
          <time dateTime={comment.iso}>{comment.date}</time>
        </div>
        <p className="comment__body">{comment.content}</p>
        {onReply && (
          <button type="button" className="comment__reply" onClick={onReply}>
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

export function PostComments({ postId, comments, count }: { postId: string; comments: PublicComment[]; count: number }) {
  const [replyTo, setReplyTo] = useState<string | null>(null);

  return (
    <section className="comments" id="comments" aria-labelledby="comments-title">
      <h2 className="comments__title" id="comments-title">
        {count === 0 ? "Comments" : `${count} Comment${count === 1 ? "" : "s"}`}
      </h2>

      {comments.length === 0 ? (
        <p className="comments__empty">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <ol className="comments__list">
          {comments.map((c) => (
            <li key={c.id}>
              <CommentItem comment={c} onReply={() => setReplyTo(replyTo === c.id ? null : c.id)} />
              {(c.replies?.length || replyTo === c.id) && (
                <ol className="comments__replies">
                  {c.replies?.map((r) => (
                    <li key={r.id}>
                      <CommentItem comment={r} onReply={() => setReplyTo(replyTo === c.id ? null : c.id)} />
                    </li>
                  ))}
                  {replyTo === c.id && (
                    <li>
                      <CommentForm postId={postId} parentId={c.id} onCancel={() => setReplyTo(null)} />
                    </li>
                  )}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="comments__new">
        <h3 className="comments__subtitle">Leave a comment</h3>
        <CommentForm postId={postId} />
      </div>
    </section>
  );
}
