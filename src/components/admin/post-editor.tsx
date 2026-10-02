"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category, Post } from "@/db/schema";
import { useToast } from "@/components/toast";
import { slugify, wordCount } from "@/lib/utils";
import { prepareImage } from "@/lib/image";
import { ImageUpload } from "./image-upload";

type PostWithCategory = Post & { category: Category | null };

const TOOLBAR_BUTTONS: { cmd: string; title: string; label: React.ReactNode }[] = [
  { cmd: "bold", title: "Bold", label: <b>B</b> },
  { cmd: "italic", title: "Italic", label: <i>I</i> },
  { cmd: "underline", title: "Underline", label: <u>U</u> },
];

export function PostEditor({
  categories,
  defaultAuthor,
  post,
}: {
  categories: Category[];
  defaultAuthor: string;
  post: PostWithCategory | null;
}) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(post?.title || "");
  const [status, setStatus] = useState(post?.status || "draft");
  const [author, setAuthor] = useState(post?.author || defaultAuthor);
  const [categoryId, setCategoryId] = useState(post?.categoryId || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [slugEdited, setSlugEdited] = useState(!!post);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [words, setWords] = useState(() => wordCount(post?.content || ""));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && post?.content) {
      editorRef.current.innerHTML = post.content;
    }
  }, [post]);

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

  const onContentInput = () => {
    setWords(wordCount(editorRef.current?.innerHTML || ""));
    markDirty();
  };

  const insertImage = async (file: File) => {
    try {
      const src = await prepareImage(file);
      editorRef.current?.focus();
      document.execCommand("insertImage", false, src);
      onContentInput();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not insert image.", "error");
    }
  };

  const runCmd = (cmd: string) => {
    editorRef.current?.focus();
    if (cmd === "h2" || cmd === "h3") {
      document.execCommand("formatBlock", false, cmd);
    } else if (cmd === "blockquote") {
      document.execCommand("formatBlock", false, "blockquote");
    } else if (cmd === "pre") {
      document.execCommand("formatBlock", false, "pre");
    } else if (cmd === "p") {
      document.execCommand("formatBlock", false, "p");
    } else if (cmd === "createLink") {
      const url = prompt("Enter URL:");
      if (url) document.execCommand("createLink", false, url);
    } else if (cmd === "insertImageUrl") {
      const url = prompt("Image URL:");
      if (url) document.execCommand("insertImage", false, url);
    } else {
      document.execCommand(cmd, false);
    }
    onContentInput();
  };

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
      content: editorRef.current?.innerHTML || "",
      coverImage,
      status: newStatus,
      author: author.trim() || defaultAuthor,
      categoryId: categoryId || null,
      slug: slug || slugify(title),
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
    showToast(newStatus === "published" ? "Post published!" : "Draft saved.");

    const saved = await res.json();
    setSlug(saved.slug);
    if (!post) router.replace(`/admin/posts/${saved.id}`);
    router.refresh();
  }, [saving, title, excerpt, coverImage, author, defaultAuthor, categoryId, slug, post, router, showToast]);

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

              <div className="editor-toolbar">
                {TOOLBAR_BUTTONS.map((b) => (
                  <button key={b.cmd} type="button" className="toolbar-btn" title={b.title} onMouseDown={(e) => { e.preventDefault(); runCmd(b.cmd); }}>
                    {b.label}
                  </button>
                ))}
                <div className="toolbar-sep" />
                <button type="button" className="toolbar-btn" title="Heading 2" onMouseDown={(e) => { e.preventDefault(); runCmd("h2"); }}>
                  H2
                </button>
                <button type="button" className="toolbar-btn" title="Heading 3" onMouseDown={(e) => { e.preventDefault(); runCmd("h3"); }}>
                  H3
                </button>
                <div className="toolbar-sep" />
                <button type="button" className="toolbar-btn" title="Bullet List" onMouseDown={(e) => { e.preventDefault(); runCmd("insertUnorderedList"); }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path d="M4 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM7 4h10a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2zm0 6h10a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2zm0 6h10a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2z" />
                  </svg>
                </button>
                <button type="button" className="toolbar-btn" title="Numbered List" onMouseDown={(e) => { e.preventDefault(); runCmd("insertOrderedList"); }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path d="M3 4h1v3H3V4zm0 5h1.5l-1.5 2h1.5v1H3v-1l1.5-2H3V9zm1 6H3v-1h2v4H3v-1h1v-2zM7 4h10a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2zm0 6h10a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2zm0 6h10a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2z" />
                  </svg>
                </button>
                <div className="toolbar-sep" />
                <button type="button" className="toolbar-btn" title="Blockquote" onMouseDown={(e) => { e.preventDefault(); runCmd("blockquote"); }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path d="M6 3a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3H5a1 1 0 0 0 1 1h1a1 1 0 0 1 0 2H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm8 0a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 1 1h1a1 1 0 0 1 0 2h-1a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
                  </svg>
                </button>
                <button type="button" className="toolbar-btn" title="Insert Link" onMouseDown={(e) => { e.preventDefault(); runCmd("createLink"); }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} width="14" height="14">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </button>
                <button type="button" className="toolbar-btn" title="Remove Link" onMouseDown={(e) => { e.preventDefault(); runCmd("unlink"); }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} width="14" height="14">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    <line x1="2" y1="2" x2="18" y2="18" />
                  </svg>
                </button>
                <div className="toolbar-sep" />
                <button type="button" className="toolbar-btn" title="Insert image (upload)" onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click(); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="14" height="14">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </button>
                <button type="button" className="toolbar-btn" title="Insert image from URL" onMouseDown={(e) => { e.preventDefault(); runCmd("insertImageUrl"); }}>
                  URL
                </button>
                <button type="button" className="toolbar-btn" title="Code block" onMouseDown={(e) => { e.preventDefault(); runCmd("pre"); }}>
                  {"</>"}
                </button>
                <button type="button" className="toolbar-btn" title="Divider" onMouseDown={(e) => { e.preventDefault(); runCmd("insertHorizontalRule"); }}>
                  —
                </button>
                <button type="button" className="toolbar-btn" title="Normal paragraph" onMouseDown={(e) => { e.preventDefault(); runCmd("p"); }}>
                  ¶
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) insertImage(file);
                    e.target.value = "";
                  }}
                />
                <div className="toolbar-sep" />
                <button type="button" className="toolbar-btn" title="Clear Formatting" onMouseDown={(e) => { e.preventDefault(); runCmd("removeFormat"); }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} width="14" height="14">
                    <path d="M6 4l8 12M4 4h12" />
                  </svg>
                </button>
              </div>

              <div
                ref={editorRef}
                className="editor-area"
                contentEditable
                onInput={onContentInput}
                data-placeholder="Start writing your article here…"
              />
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
                  {status === "published" ? "Update" : "Publish"}
                </button>
              </div>
              {post && (
                <Link
                  href={post.status === "published" ? `/post/${slug}` : `/admin/posts/${post.id}/preview`}
                  target="_blank"
                  className="btn btn--ghost btn--sm btn--full"
                  style={{ marginBottom: 18, justifyContent: "center" }}
                >
                  {post.status === "published" ? "View live post ↗" : "Preview draft ↗"}
                </Link>
              )}
              <div className="form-group">
                <label htmlFor="postStatus">Status</label>
                <select id="postStatus" value={status} onChange={(e) => { setStatus(e.target.value); markDirty(); }}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="postAuthor">Author</label>
                <input type="text" id="postAuthor" placeholder="Author name" value={author} onChange={(e) => { setAuthor(e.target.value); markDirty(); }} />
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
