"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Post, Subscriber } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { apiSend } from "@/lib/admin-api";
import { ConfirmDialog } from "./ui";

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
    const res = await apiSend<{ sent: number; failed: number }>("/api/newsletter/send", "POST", { postId: pendingSend.id }, "Failed to send the newsletter.");
    setSending(false);
    setPendingSend(null);
    if (!res.ok) return showToast(res.error, "error");
    const { sent, failed } = res.data;
    showToast(
      failed
        ? `Sent to ${sent} subscriber${sent === 1 ? "" : "s"}; ${failed} failed.`
        : `Sent to ${sent} subscriber${sent === 1 ? "" : "s"}.`,
      failed ? "error" : "success"
    );
    router.refresh();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const res = await apiSend(`/api/subscribers/${pendingDelete.id}`, "DELETE", undefined, "Failed to remove subscriber.");
    setPendingDelete(null);
    if (!res.ok) return showToast(res.error, "error");
    showToast("Subscriber removed.");
    router.refresh();
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
                    <td className="posts-table__date">{formatDate(post.publishedAt)}</td>
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
              className="dash-control"
              aria-label="Search subscribers"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="dash-control"
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
                    <td className="posts-table__wrap">{s.email}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[s.status] || "badge--gray"}`}>{STATUS_LABEL[s.status] || s.status}</span>
                    </td>
                    <td className="posts-table__date">{formatDate(s.createdAt)}</td>
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

      <ConfirmDialog
        open={!!pendingSend}
        title="Send to subscribers?"
        confirmLabel="Send"
        tone="primary"
        busy={sending}
        busyLabel="Sending…"
        onConfirm={handleSend}
        onCancel={() => setPendingSend(null)}
      >
        {pendingSend ? <>“{pendingSend.title}” will be emailed to </> : null}
        {counts.active} subscriber{counts.active === 1 ? "" : "s"}. Each post can only be sent once.
      </ConfirmDialog>

      <ConfirmDialog open={!!pendingDelete} title="Remove subscriber?" confirmLabel="Remove" onConfirm={handleDelete} onCancel={() => setPendingDelete(null)}>
        {pendingDelete ? <>{pendingDelete.email} will be removed from your list. </> : null}They can sign up again later.
      </ConfirmDialog>

      {toastElement}
    </>
  );
}
