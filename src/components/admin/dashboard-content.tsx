"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Post } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/toast";

type PostWithCategory = Post & { category: Category | null };

export function DashboardContent({ posts }: { posts: PostWithCategory[] }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const categoryCount = useMemo(
    () => new Set(posts.map((p) => p.category?.name).filter(Boolean)).size,
    [posts]
  );

  const filtered = statusFilter === "all" ? posts : posts.filter((p) => p.status === statusFilter);

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

  return (
    <>
      <div className="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat__value">{posts.length}</div>
          <div className="dash-stat__label">Total Posts</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat__value">{published}</div>
          <div className="dash-stat__label">Published</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat__value">{drafts}</div>
          <div className="dash-stat__label">Drafts</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat__value">{categoryCount}</div>
          <div className="dash-stat__label">Categories</div>
        </div>
      </div>

      <div className="posts-table-wrap">
        <div className="posts-table-header">
          <h2>All Posts</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "7px 12px",
                border: "1.5px solid var(--gray-200)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-body)",
                fontSize: ".85rem",
              }}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="posts-table__empty">
            <p>No posts found.</p>
          </div>
        ) : (
          <table className="posts-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id}>
                  <td>
                    <div className="posts-table__title">
                      {post.title}
                      <p>{post.excerpt || "No excerpt"}</p>
                    </div>
                  </td>
                  <td>{post.category ? <span className="badge badge--gray">{post.category.name}</span> : "—"}</td>
                  <td>
                    <span className={`badge ${post.status === "published" ? "badge--green" : "badge--gold"}`}>
                      {post.status}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--gray-400)" }}>{formatDate(post.createdAt)}</td>
                  <td>
                    <div className="posts-table__actions">
                      <Link href={`/admin/posts/${post.id}`} className="btn btn--ghost btn--sm">
                        Edit
                      </Link>
                      {post.status === "published" && (
                        <Link href={`/post/${post.slug}`} target="_blank" className="btn btn--ghost btn--sm">
                          View
                        </Link>
                      )}
                      <button className="btn btn--danger btn--sm" onClick={() => setPendingDeleteId(post.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={`modal-overlay${pendingDeleteId ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setPendingDeleteId(null); }}>
        <div className="modal">
          <h2 className="modal__title">Delete Post?</h2>
          <p className="modal__body">This action cannot be undone. The post will be permanently removed.</p>
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
