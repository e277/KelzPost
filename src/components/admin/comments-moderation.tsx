"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { COMMENT_LIMITS, type CommentStatus } from "@/lib/comments";
import { useToast } from "@/components/toast";

export type AdminComment = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  replyingTo: string | null;
  authorName: string;
  authorEmail: string;
  content: string;
  isAuthor: boolean;
  status: string;
  date: string;
};

const TABS: { status: CommentStatus; label: string; empty: string }[] = [
  { status: "pending", label: "Waiting", empty: "No comments are waiting for approval." },
  { status: "approved", label: "Approved", empty: "No approved comments yet." },
  { status: "spam", label: "Spam", empty: "No spam. Comments with lots of links land here automatically." },
];

export function CommentsModeration({
  status,
  counts,
  comments,
}: {
  status: CommentStatus;
  counts: Record<CommentStatus, number>;
  comments: AdminComment[];
}) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const tab = TABS.find((t) => t.status === status)!;

  const setStatus = async (c: AdminComment, next: CommentStatus, message: string) => {
    setBusyId(c.id);
    const res = await fetch(`/api/comments/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusyId(null);
    if (res.ok) {
      showToast(message);
      router.refresh();
    } else {
      showToast("Failed to update comment.", "error");
    }
  };

  const sendReply = async (c: AdminComment) => {
    if (!reply.trim()) return;
    setBusyId(c.id);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: c.postId, parentId: c.id, content: reply }),
    });
    setBusyId(null);
    if (res.ok) {
      setReply("");
      setReplyId(null);
      showToast(c.status === "pending" ? "Reply posted and comment approved." : "Reply posted.");
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      showToast(json.error || "Failed to post reply.", "error");
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    const res = await fetch(`/api/comments/${pendingDeleteId}`, { method: "DELETE" });
    setPendingDeleteId(null);
    if (res.ok) {
      showToast("Comment deleted.");
      router.refresh();
    } else {
      showToast("Failed to delete comment.", "error");
    }
  };

  return (
    <>
      <div className="posts-table-wrap">
        <div className="posts-table-header">
          <h2>{tab.label}</h2>
          <nav className="comment-tabs" aria-label="Comment status">
            {TABS.map((t) => (
              <Link
                key={t.status}
                href={t.status === "pending" ? "/admin/comments" : `/admin/comments?status=${t.status}`}
                className={`filter-btn${t.status === status ? " active" : ""}`}
                aria-current={t.status === status ? "page" : undefined}
              >
                {t.label} <span className="comment-tabs__count">{counts[t.status]}</span>
              </Link>
            ))}
          </nav>
        </div>

        {comments.length === 0 ? (
          <div className="posts-table__empty">
            <p>{tab.empty}</p>
          </div>
        ) : (
          <ul className="comment-mod-list">
            {comments.map((c) => (
              <li key={c.id} className="comment-mod">
                <div className="comment-mod__head">
                  <strong className="comment-mod__name">{c.authorName}</strong>
                  {c.isAuthor && <span className="badge badge--navy">Author</span>}
                  {c.authorEmail && (
                    <a href={`mailto:${c.authorEmail}`} className="comment-mod__email">
                      {c.authorEmail}
                    </a>
                  )}
                  <span className="comment-mod__date">{c.date}</span>
                </div>
                <p className="comment-mod__on">
                  {c.replyingTo ? <>Reply to {c.replyingTo} on </> : <>On </>}
                  <a href={`/post/${c.postSlug}#comments`} target="_blank" rel="noopener noreferrer">
                    {c.postTitle}
                  </a>
                </p>
                <p className="comment-mod__body">{c.content}</p>

                <div className="comment-mod__actions">
                  {c.status !== "approved" && (
                    <button
                      className="btn btn--primary btn--sm"
                      disabled={busyId === c.id}
                      onClick={() => setStatus(c, "approved", c.status === "spam" ? "Marked as not spam and approved." : "Comment approved.")}
                    >
                      {c.status === "spam" ? "Not spam" : "Approve"}
                    </button>
                  )}
                  {c.status !== "spam" && (
                    <button
                      className="btn btn--ghost btn--sm"
                      disabled={busyId === c.id}
                      onClick={() => {
                        setReplyId(replyId === c.id ? null : c.id);
                        setReply("");
                      }}
                    >
                      Reply
                    </button>
                  )}
                  {c.status === "approved" && (
                    <button className="btn btn--ghost btn--sm" disabled={busyId === c.id} onClick={() => setStatus(c, "pending", "Comment hidden from the post.")}>
                      Unapprove
                    </button>
                  )}
                  {c.status !== "spam" && (
                    <button className="btn btn--ghost btn--sm" disabled={busyId === c.id} onClick={() => setStatus(c, "spam", "Moved to spam.")}>
                      Spam
                    </button>
                  )}
                  <button className="btn btn--danger btn--sm" disabled={busyId === c.id} onClick={() => setPendingDeleteId(c.id)}>
                    Delete
                  </button>
                </div>

                {replyId === c.id && (
                  <div className="comment-mod__reply">
                    <div className="form-group">
                      <label htmlFor={`reply-${c.id}`}>
                        Your reply{c.status === "pending" ? " (this also approves the comment)" : ""}
                      </label>
                      <textarea
                        id={`reply-${c.id}`}
                        rows={3}
                        value={reply}
                        maxLength={COMMENT_LIMITS.content}
                        onChange={(e) => setReply(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="comment-mod__actions">
                      <button className="btn btn--primary btn--sm" disabled={busyId === c.id || !reply.trim()} onClick={() => sendReply(c)}>
                        Post reply
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => setReplyId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`modal-overlay${pendingDeleteId ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setPendingDeleteId(null); }}>
        <div className="modal" role="dialog" aria-modal="true">
          <h2 className="modal__title">Delete Comment?</h2>
          <p className="modal__body">The comment and any replies to it will be permanently removed. This action cannot be undone.</p>
          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </button>
            <button className="btn btn--danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>

      {toastElement}
    </>
  );
}
