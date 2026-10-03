"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Post, Subscriber } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/toast";

type SubscriberRow = Omit<Subscriber, "token">;
type PostRow = Pick<Post, "id" | "title" | "slug" | "publishedAt" | "newsletterSentAt">;
type StatusFilter = "all" | "active" | "pending" | "unsubscribed";

const STATUS_BADGE: Record<string, string> = {
  active: "badge--green",
  pending: "badge--gold",
  unsubscribed: "badge--gray",
};
const STATUS_LABEL: Record<string, string> = {
  active: "subscribed",
  pending: "unconfirmed",
  unsubscribed: "unsubscribed",
};

export function NewsletterManager({
  subscribers,
  posts,
  missingSettings,
}: {
  subscribers: SubscriberRow[];
  posts: PostRow[];
  missingSettings: string[];
}) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [pendingSend, setPendingSend] = useState<PostRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SubscriberRow | null>(null);
  const [sending, setSending] = useState(false);

  const configured = missingSettings.length === 0;
  const counts = {
    active: subscribers.filter((s) => s.status === "active").length,
    pending: subscribers.filter((s) => s.status === "pending").length,
    unsubscribed: subscribers.filter((s) => s.status === "unsubscribed").length,
  };

  const q = search.trim().toLowerCase();
  const filtered = subscribers
    .filter((s) => statusFilter === "all" || s.status === statusFilter)
    .filter((s) => !q || s.email.includes(q));

  const handleSend = async () => {
    if (!pendingSend) return;
    setSending(true);
    const res = await fetch("/api/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: pendingSend.id }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setSending(false);
    setPendingSend(null);
    if (res?.ok) {
      showToast(
        data.failed
          ? `Sent to ${data.sent} subscriber${data.sent === 1 ? "" : "s"}; ${data.failed} failed.`
          : `Sent to ${data.sent} subscriber${data.sent === 1 ? "" : "s"}.`,
        data.failed ? "error" : "success"
      );
      router.refresh();
    } else {
      showToast(data?.error || "Failed to send the newsletter.", "error");
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const res = await fetch(`/api/subscribers/${pendingDelete.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (res.ok) {
      showToast("Subscriber removed.");
      router.refresh();
    } else {
      showToast("Failed to remove subscriber.", "error");
    }
  };

  const controlStyle = {
    padding: "7px 12px",
    border: "1.5px solid var(--gray-200)",
    borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-body)",
    fontSize: ".85rem",
  };

  return (
    <>
      {!configured && (
        <div className="admin-alert" role="alert">
          <strong>Email isn&apos;t set up yet.</strong> The signup form stays hidden until these environment variables are set in
          Vercel: {missingSettings.map((k, i) => (
            <span key={k}>
              {i > 0 && ", "}
              <code>{k}</code>
            </span>
          ))}
          . See the README for details.
        </div>
      )}

      <div className="dash-stats">
        <button type="button" className={`dash-stat${statusFilter === "active" ? " is-active" : ""}`} onClick={() => setStatusFilter("active")}>
          <div className="dash-stat__value">{counts.active}</div>
          <div className="dash-stat__label">Subscribers</div>
        </button>
        <button type="button" className={`dash-stat${statusFilter === "pending" ? " is-active" : ""}`} onClick={() => setStatusFilter("pending")}>
          <div className="dash-stat__value">{counts.pending}</div>
          <div className="dash-stat__label">Awaiting confirmation</div>
        </button>
        <button
          type="button"
          className={`dash-stat${statusFilter === "unsubscribed" ? " is-active" : ""}`}
          onClick={() => setStatusFilter("unsubscribed")}
        >
          <div className="dash-stat__value">{counts.unsubscribed}</div>
          <div className="dash-stat__label">Unsubscribed</div>
        </button>
        <div className="dash-stat">
          <div className="dash-stat__value">{posts.filter((p) => p.newsletterSentAt).length}</div>
          <div className="dash-stat__label">Recent posts emailed</div>
        </div>
      </div>

      <div className="posts-table-wrap">
        <div className="posts-table-header">
          <h2>Email a post</h2>
        </div>
        {posts.length === 0 ? (
          <div className="posts-table__empty">
            <p>Publish a post to email it to your subscribers.</p>
          </div>
        ) : (
          <div className="posts-table-scroll">
            <table className="posts-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Published</th>
                  <th>Newsletter</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className="posts-table__title">
                        <Link href={`/post/${post.slug}`} target="_blank">
                          {post.title}
                        </Link>
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--gray-400)" }}>{formatDate(post.publishedAt)}</td>
                    <td>
                      {post.newsletterSentAt ? (
                        <span className="badge badge--green" title={new Date(post.newsletterSentAt).toLocaleString()}>
                          sent {formatDate(post.newsletterSentAt)}
                        </span>
                      ) : (
                        <span className="badge badge--gray">not sent</span>
                      )}
                    </td>
                    <td>
                      <div className="posts-table__actions">
                        <button
                          className="btn btn--primary btn--sm"
                          disabled={!configured || counts.active === 0 || Boolean(post.newsletterSentAt)}
                          title={
                            !configured
                              ? "Set up email first"
                              : counts.active === 0
                                ? "No confirmed subscribers yet"
                                : post.newsletterSentAt
                                  ? "Already sent"
                                  : undefined
                          }
                          onClick={() => setPendingSend(post)}
                        >
                          Send
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="posts-table-wrap" style={{ marginTop: 24 }}>
        <div className="posts-table-header">
          <h2>
            {statusFilter === "all"
              ? "All Subscribers"
              : statusFilter === "active"
                ? "Subscribers"
                : statusFilter === "pending"
                  ? "Awaiting confirmation"
                  : "Unsubscribed"}
          </h2>
          <div className="posts-table-controls">
            <input
              type="search"
              placeholder="Search emails…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={controlStyle}
              aria-label="Search subscribers"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={controlStyle}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Subscribed</option>
              <option value="pending">Unconfirmed</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="posts-table__empty">
            <p>{subscribers.length === 0 ? "No one has signed up yet." : "No subscribers match your filters."}</p>
          </div>
        ) : (
          <div className="posts-table-scroll">
            <table className="posts-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Signed up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ overflowWrap: "anywhere" }}>{s.email}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[s.status] || "badge--gray"}`}>{STATUS_LABEL[s.status] || s.status}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--gray-400)" }}>{formatDate(s.createdAt)}</td>
                    <td>
                      <div className="posts-table__actions">
                        <button className="btn btn--danger btn--sm" onClick={() => setPendingDelete(s)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        className={`modal-overlay${pendingSend ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget && !sending) setPendingSend(null);
        }}
      >
        <div className="modal" role="dialog" aria-modal="true">
          <h2 className="modal__title">Send to subscribers?</h2>
          <p className="modal__body">
            {pendingSend ? <>“{pendingSend.title}” will be emailed to </> : null}
            {counts.active} subscriber{counts.active === 1 ? "" : "s"}. Each post can only be sent once.
          </p>
          <div className="modal__actions">
            <button className="btn btn--ghost" disabled={sending} onClick={() => setPendingSend(null)}>
              Cancel
            </button>
            <button className="btn btn--primary" disabled={sending} onClick={handleSend}>
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`modal-overlay${pendingDelete ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPendingDelete(null);
        }}
      >
        <div className="modal" role="dialog" aria-modal="true">
          <h2 className="modal__title">Remove subscriber?</h2>
          <p className="modal__body">
            {pendingDelete ? <>{pendingDelete.email} will be removed from your list. </> : null}They can sign up again later.
          </p>
          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </button>
            <button className="btn btn--danger" onClick={handleDelete}>
              Remove
            </button>
          </div>
        </div>
      </div>

      {toastElement}
    </>
  );
}
