"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/toast";

export type DashboardPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: string;
  category: { name: string } | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  words: number;
  /** All-time views. */
  views: number;
  /** Views in the last 30 days. */
  recentViews: number;
};
type SortKey = "updated" | "created" | "title" | "views";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function DashboardContent({
  posts,
  categoryCount,
  username,
  readership,
}: {
  posts: DashboardPost[];
  categoryCount: number;
  username: string;
  readership?: ReactNode;
}) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // The stats come from server-rendered props, so a dashboard left open in another tab, or
  // restored from the browser's back/forward cache, keeps showing old numbers. Re-fetch them
  // whenever the dashboard comes back into view.
  useEffect(() => {
    const refresh = () => router.refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.length - published;
  const totalWords = posts.reduce((sum, p) => sum + p.words, 0);

  const q = search.trim().toLowerCase();
  const filtered = posts
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter((p) => !q || `${p.title} ${p.excerpt} ${p.category?.name || ""}`.toLowerCase().includes(q))
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "views"
          ? b.views - a.views
          : sort === "created"
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : b.updatedAt.getTime() - a.updatedAt.getTime()
    );

  const pendingPost = posts.find((p) => p.id === pendingDeleteId);

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    const res = await fetch(`/api/posts/${pendingDeleteId}`, { method: "DELETE" });
    setPendingDeleteId(null);
    if (res.ok) {
      showToast("Post deleted.");
      router.refresh();
    } else {
      showToast("Failed to delete post.", "error");
    }
  };

  const toggleStatus = async (post: DashboardPost) => {
    const status = post.status === "published" ? "draft" : "published";
    setBusyId(post.id);
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (res.ok) {
      showToast(status === "published" ? `“${post.title}” is live.` : `“${post.title}” moved to drafts.`);
      router.refresh();
    } else {
      showToast("Failed to update post.", "error");
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
      <p className="dash-greeting" suppressHydrationWarning>
        {greeting()}, <strong>{username}</strong>.{" "}
        {drafts > 0 ? `You have ${drafts} draft${drafts === 1 ? "" : "s"} in progress.` : "Ready to write something new?"}
      </p>

      <div className="dash-stats">
        <button type="button" className={`dash-stat${statusFilter === "all" ? " is-active" : ""}`} onClick={() => setStatusFilter("all")}>
          <div className="dash-stat__value">{posts.length}</div>
          <div className="dash-stat__label">Total Posts</div>
        </button>
        <button type="button" className={`dash-stat${statusFilter === "published" ? " is-active" : ""}`} onClick={() => setStatusFilter("published")}>
          <div className="dash-stat__value">{published}</div>
          <div className="dash-stat__label">Published</div>
        </button>
        <button type="button" className={`dash-stat${statusFilter === "draft" ? " is-active" : ""}`} onClick={() => setStatusFilter("draft")}>
          <div className="dash-stat__value">{drafts}</div>
          <div className="dash-stat__label">Drafts</div>
        </button>
        <div className="dash-stat">
          <div className="dash-stat__value">{totalWords.toLocaleString()}</div>
          <div className="dash-stat__label">Words written · {categoryCount} categories</div>
        </div>
      </div>

      {readership}

      <div className="posts-table-wrap">
        <div className="posts-table-header">
          <h2>{statusFilter === "all" ? "All Posts" : statusFilter === "published" ? "Published" : "Drafts"}</h2>
          <div className="posts-table-controls">
            <input
              type="search"
              placeholder="Search posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={controlStyle}
              aria-label="Search posts"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={controlStyle} aria-label="Filter by status">
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={controlStyle} aria-label="Sort posts">
              <option value="updated">Last edited</option>
              <option value="created">Newest</option>
              <option value="title">Title A–Z</option>
              <option value="views">Most read</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="posts-table__empty">
            {posts.length === 0 ? (
              <>
                <p>You haven&apos;t written anything yet.</p>
                <Link href="/admin/posts/new" className="btn btn--primary btn--sm" style={{ marginTop: 12 }}>
                  Write your first post
                </Link>
              </>
            ) : (
              <p>No posts match your filters.</p>
            )}
          </div>
        ) : (
          <div className="posts-table-scroll">
            <table className="posts-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>{sort === "created" ? "Created" : "Last edited"}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className="posts-table__title">
                        <Link href={`/admin/posts/${post.id}`}>{post.title}</Link>
                        <p>
                          {post.excerpt || "No excerpt"} · {post.words.toLocaleString()} words
                        </p>
                      </div>
                    </td>
                    <td>{post.category ? <span className="badge badge--gray">{post.category.name}</span> : "—"}</td>
                    <td>
                      {post.status === "published" && post.publishedAt && new Date(post.publishedAt) > new Date() ? (
                        <span className="badge badge--navy" title={`Goes live ${new Date(post.publishedAt).toLocaleString()}`}>scheduled</span>
                      ) : (
                        <span className={`badge ${post.status === "published" ? "badge--green" : "badge--gold"}`}>{post.status}</span>
                      )}
                    </td>
                    <td className="posts-table__views">
                      {post.views.toLocaleString()}
                      {post.views > 0 && <small>{post.recentViews.toLocaleString()} in 30 days</small>}
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--gray-400)" }}>
                      {formatDate(sort === "created" ? post.createdAt : post.updatedAt)}
                    </td>
                    <td>
                      <div className="posts-table__actions">
                        <Link href={`/admin/posts/${post.id}`} className="btn btn--ghost btn--sm">
                          Edit
                        </Link>
                        <Link
                          href={post.status === "published" ? `/post/${post.slug}` : `/admin/posts/${post.id}/preview`}
                          target="_blank"
                          className="btn btn--ghost btn--sm"
                        >
                          {post.status === "published" ? "View" : "Preview"}
                        </Link>
                        <button className="btn btn--ghost btn--sm" disabled={busyId === post.id} onClick={() => toggleStatus(post)}>
                          {post.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button className="btn btn--danger btn--sm" onClick={() => setPendingDeleteId(post.id)}>
                          Delete
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

      <div className={`modal-overlay${pendingDeleteId ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setPendingDeleteId(null); }}>
        <div className="modal" role="dialog" aria-modal="true">
          <h2 className="modal__title">Delete Post?</h2>
          <p className="modal__body">
            {pendingPost ? <>“{pendingPost.title}” will be permanently removed. </> : null}This action cannot be undone.
          </p>
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
