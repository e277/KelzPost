"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category, Post } from "@/db/schema";
import { useToast } from "@/components/toast";
import { slugify, wordCount } from "@/lib/utils";
import { uploadImage } from "@/lib/image";
import { ImageUpload } from "./image-upload";
import { RichTextEditor, useRichTextEditor } from "./rich-text-editor";

type PostWithCategory = Post & { category: Category | null };

/** A Date as the "YYYY-MM-DDTHH:mm" local-time string a datetime-local input expects. */
function toLocalInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseTagInput(raw: string): string[] {
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

export function PostEditor({
  categories,
  defaultAuthor,
  post,
  tags = [],
  allTags = [],
}: {
  categories: Category[];
  defaultAuthor: string;
  post: PostWithCategory | null;
  tags?: string[];
  allTags?: string[];
}) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();

  const [title, setTitle] = useState(post?.title || "");
  const [status, setStatus] = useState(post?.status || "draft");
  // Empty means "the blog's author from Settings", so renaming the author there updates every such post.
  const [author, setAuthor] = useState(post?.author && post.author !== defaultAuthor ? post.author : "");
  const [categoryId, setCategoryId] = useState(post?.categoryId || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [slugEdited, setSlugEdited] = useState(!!post);
  const [publishDate, setPublishDate] = useState(() => toLocalInput(post?.publishedAt));
  const [tagInput, setTagInput] = useState(tags.join(", "));
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription || "");
  const [ogImage, setOgImage] = useState(post?.ogImage || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [words, setWords] = useState(() => wordCount(post?.content || ""));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const { editor, insertImages } = useRichTextEditor({
    content: post?.content || "",
    placeholder: "Start writing your article here…",
    onUpdate: (e) => {
      setWords(countWords(e.getText()));
      setDirty(true);
    },
    uploadImage,
    onError: (m) => showToast(m, "error"),
  });

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const markDirty = () => setDirty(true);

  const save = useCallback(async (newStatus: string) => {
    if (saving) return;
    if (!title.trim()) {
      showToast("Please add a title.", "error");
      return;
    }
    setSaving(true);

    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: !editor || editor.isEmpty ? "" : editor.getHTML(),
      coverImage,
      status: newStatus,
      author: author.trim() === defaultAuthor ? "" : author.trim(),
      categoryId: categoryId || null,
      slug: slug || slugify(title),
      publishedAt: publishDate ? new Date(publishDate).toISOString() : "",
      tags: parseTagInput(tagInput),
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
      ogImage: ogImage.trim(),
    };

    const body = JSON.stringify(payload);
    // Vercel rejects request bodies over 4.5 MB.
    if (body.length > 4_200_000) {
      setSaving(false);
      showToast("This post is too large to save — try removing or using URLs for some images.", "error");
      return;
    }

    const res = await fetch(post ? `/api/posts/${post.id}` : "/api/posts", {
      method: post ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => null);

    if (!res) {
      setSaving(false);
      showToast("Network error — your changes were not saved.", "error");
      return;
    }

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "Failed to save post.", "error");
      return;
    }

    setStatus(newStatus);
    setDirty(false);
    const saved = await res.json();
    const goesLiveLater = newStatus === "published" && saved.publishedAt && new Date(saved.publishedAt) > new Date();
    showToast(
      goesLiveLater
        ? `Scheduled for ${new Date(saved.publishedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`
        : newStatus === "published"
          ? "Post published!"
          : "Draft saved."
    );
    if (newStatus === "published" && saved.publishedAt) setPublishDate(toLocalInput(saved.publishedAt));

    setSlug(saved.slug);
    if (!post) router.replace(`/admin/posts/${saved.id}`);
    router.refresh();
  }, [saving, title, excerpt, editor, coverImage, author, defaultAuthor, categoryId, slug, publishDate, tagInput, seoTitle, seoDescription, ogImage, post, router, showToast]);

  const scheduled = !!publishDate && new Date(publishDate) > new Date();
  const isLiveNow = post?.status === "published" && !!post.publishedAt && new Date(post.publishedAt) <= new Date();
  const metaTitle = seoTitle.trim() || title.trim() || "Post title";
  const metaDescription = seoDescription.trim() || excerpt.trim() || "Add an excerpt or meta description to control this text.";

  // Ctrl/Cmd+S saves, keeping the current status.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save(status);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save, status]);

  const handleDelete = async () => {
    if (!post) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      setDirty(false);
      router.push("/admin");
    } else {
      showToast("Failed to delete post.", "error");
    }
  };

  return (
    <>
      <div className="editor-layout">
        <div>
          <div className="editor-card" style={{ marginBottom: 20 }}>
            <div className="editor-card__body">
              <input
                type="text"
                className="editor-title"
                placeholder="Post title…"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugEdited) setSlug(slugify(e.target.value));
                  markDirty();
                }}
              />

              <RichTextEditor editor={editor} insertImages={insertImages} onError={(m) => showToast(m, "error")} />
              <div className="editor-statusbar">
                <span>
                  {words.toLocaleString()} words · {Math.max(1, Math.round(words / 225))} min read
                </span>
                <span>{saving ? "Saving…" : dirty ? "Unsaved changes" : post ? "All changes saved" : ""} · Ctrl/⌘+S to save</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-panel">
          <div className="editor-card">
            <div className="editor-card__header">Post Status</div>
            <div className="editor-card__body">
              <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <button type="button" className="btn btn--ghost btn--sm" style={{ flex: 1 }} disabled={saving} onClick={() => save("draft")}>
                  {status === "published" ? "Unpublish" : "Save Draft"}
                </button>
                <button type="button" className="btn btn--primary btn--sm" style={{ flex: 1 }} disabled={saving} onClick={() => save("published")}>
                  {scheduled ? (status === "published" ? "Update Schedule" : "Schedule") : status === "published" ? "Update" : "Publish"}
                </button>
              </div>
              {post && (
                <Link
                  href={isLiveNow ? `/post/${slug}` : `/admin/posts/${post.id}/preview`}
                  target="_blank"
                  className="btn btn--ghost btn--sm btn--full"
                  style={{ marginBottom: 18, justifyContent: "center" }}
                >
                  {isLiveNow ? "View live post ↗" : "Preview post ↗"}
                </Link>
              )}
              <div className="form-group">
                <label htmlFor="postStatus">Status</label>
                <select id="postStatus" value={status} onChange={(e) => { setStatus(e.target.value); markDirty(); }}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="postPublishDate">Publish date</label>
                <input
                  type="datetime-local"
                  id="postPublishDate"
                  value={publishDate}
                  onChange={(e) => { setPublishDate(e.target.value); markDirty(); }}
                />
                <small className="field-hint">
                  {scheduled
                    ? `Goes live automatically on ${new Date(publishDate).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`
                    : "Leave empty to publish now, or pick a future date to schedule."}
                </small>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="postAuthor">Author</label>
                <input type="text" id="postAuthor" placeholder={defaultAuthor || "Author name"} value={author} onChange={(e) => { setAuthor(e.target.value); markDirty(); }} />
                <small className="field-hint">Leave empty to use the author name from Settings ({defaultAuthor || "not set"}). Fill in only for guest authors.</small>
              </div>
            </div>
          </div>

          <div className="editor-card">
            <div className="editor-card__header">Details</div>
            <div className="editor-card__body">
              <div className="form-group">
                <label htmlFor="postCategory">Category</label>
                <select id="postCategory" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); markDirty(); }}>
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="postTags">Tags</label>
                <input
                  type="text"
                  id="postTags"
                  list="postTagSuggestions"
                  placeholder="e.g. travel, productivity"
                  value={tagInput}
                  onChange={(e) => { setTagInput(e.target.value); markDirty(); }}
                />
                <datalist id="postTagSuggestions">
                  {allTags
                    .filter((t) => !parseTagInput(tagInput).some((x) => x.toLowerCase() === t.toLowerCase()))
                    .map((t) => (
                      <option key={t} value={tagInput.includes(",") ? `${tagInput.slice(0, tagInput.lastIndexOf(",") + 1)} ${t}` : t} />
                    ))}
                </datalist>
                <small className="field-hint">Separate with commas. Each tag gets its own page.</small>
              </div>
              <div className="form-group">
                <label htmlFor="postSlug">URL slug</label>
                <input
                  type="text"
                  id="postSlug"
                  placeholder="post-url"
                  value={slug}
                  onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); markDirty(); }}
                />
                <small className="field-hint">/post/{slug || "…"}</small>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="postExcerpt">Excerpt</label>
                <textarea
                  id="postExcerpt"
                  rows={3}
                  placeholder="Short summary shown in listings…"
                  value={excerpt}
                  maxLength={300}
                  onChange={(e) => { setExcerpt(e.target.value); markDirty(); }}
                />
                <small className="field-hint">{excerpt.length}/300 — used in listings, search results and link previews.</small>
              </div>
            </div>
          </div>

          <div className="editor-card">
            <div className="editor-card__header">Cover Image</div>
            <div className="editor-card__body">
              <ImageUpload value={coverImage} onChange={(v) => { setCoverImage(v); markDirty(); }} onError={(m) => showToast(m, "error")} />
            </div>
          </div>

          <div className="editor-card">
            <div className="editor-card__header">Search &amp; Social</div>
            <div className="editor-card__body">
              <div className="seo-preview" aria-label="Search result preview">
                <div className="seo-preview__url">/post/{slug || "…"}</div>
                <div className="seo-preview__title">{metaTitle}</div>
                <div className="seo-preview__desc">{metaDescription}</div>
              </div>
              <div className="form-group">
                <label htmlFor="postSeoTitle">Meta title</label>
                <input
                  type="text"
                  id="postSeoTitle"
                  placeholder={title || "Defaults to the post title"}
                  value={seoTitle}
                  maxLength={70}
                  onChange={(e) => { setSeoTitle(e.target.value); markDirty(); }}
                />
                <small className="field-hint">{seoTitle.length}/60 recommended. Leave empty to use the post title.</small>
              </div>
              <div className="form-group">
                <label htmlFor="postSeoDescription">Meta description</label>
                <textarea
                  id="postSeoDescription"
                  rows={3}
                  placeholder="Defaults to the excerpt"
                  value={seoDescription}
                  maxLength={200}
                  onChange={(e) => { setSeoDescription(e.target.value); markDirty(); }}
                />
                <small className="field-hint">{seoDescription.length}/160 recommended.</small>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="postOgImage">Social share image URL</label>
                <input
                  type="url"
                  id="postOgImage"
                  placeholder="https://…"
                  value={ogImage}
                  onChange={(e) => { setOgImage(e.target.value); markDirty(); }}
                />
                <small className="field-hint">Optional. Without one, a branded share image is generated from the title.</small>
              </div>
            </div>
          </div>

          {post && (
            <div className="editor-card">
              <div className="editor-card__header" style={{ color: "var(--red)" }}>
                Danger Zone
              </div>
              <div className="editor-card__body">
                <button type="button" className="btn btn--danger btn--sm btn--full" onClick={() => setShowDeleteModal(true)}>
                  Delete This Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`modal-overlay${showDeleteModal ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
        <div className="modal">
          <h2 className="modal__title">Delete Post?</h2>
          <p className="modal__body">This will permanently delete this post. This cannot be undone.</p>
          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={() => setShowDeleteModal(false)}>
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
