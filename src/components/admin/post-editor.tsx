"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/react";
import type { Category, Post } from "@/db/schema";
import { useToast } from "@/components/toast";
import { slugify, wordCount } from "@/lib/utils";
import { uploadImage } from "@/lib/image";
import { ImageUpload } from "./image-upload";
import { RichTextEditor, useRichTextEditor } from "./rich-text-editor";
import { RevisionHistory, type Revision } from "./revision-history";

type PostWithCategory = Post & { category: Category | null };
/** A team member the post can be credited to, with the name their posts show. */
export type TeamMember = { id: string; name: string };
/** Unsaved title, excerpt and body kept in this browser in case the tab closes. */
type Backup = { title: string; excerpt: string; content: string; savedAt: number };

/** How long after the last keystroke a draft is saved automatically. */
const AUTOSAVE_DELAY_MS = 4000;

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
const backupKey = (id: string | null) => `post-backup:${id ?? "new"}`;
const timeOf = (d: Date | number) => new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

function readBackup(id: string | null): Backup | null {
  try {
    const raw = localStorage.getItem(backupKey(id));
    return raw ? (JSON.parse(raw) as Backup) : null;
  } catch {
    return null;
  }
}

function clearBackups(...ids: (string | null)[]) {
  try {
    for (const id of ids) localStorage.removeItem(backupKey(id));
  } catch {}
}

export function PostEditor({
  categories,
  post,
  tags = [],
  allTags = [],
  team,
  canChooseAuthor,
  currentUserId,
  siteAuthorName,
}: {
  categories: Category[];
  post: PostWithCategory | null;
  tags?: string[];
  allTags?: string[];
  team: TeamMember[];
  /** Admins can credit a post to anyone on the team. */
  canChooseAuthor: boolean;
  currentUserId: string;
  /** Settings → Author, shown for posts not credited to a team member. */
  siteAuthorName: string;
}) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();

  // The post's id once it exists; a new post gets one on its first save (manual or automatic).
  const [postId, setPostId] = useState<string | null>(post?.id ?? null);
  const [savedStatus, setSavedStatus] = useState(post?.status || "draft");
  const [savedPublishedAt, setSavedPublishedAt] = useState<Date | null>(post?.publishedAt ?? null);
  const [title, setTitle] = useState(post?.title || "");
  const [status, setStatus] = useState(post?.status || "draft");
  const [authorId, setAuthorId] = useState(post ? post.authorId || "" : currentUserId);
  // A guest author's name; empty means the team member the post is credited to.
  const [author, setAuthor] = useState(post?.author || "");
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
  const [lastSaved, setLastSaved] = useState<{ at: number; auto: boolean } | null>(null);
  const [autosaveFailed, setAutosaveFailed] = useState(false);
  const [backup, setBackup] = useState<Backup | null>(null);
  // Counts edits, so a save only clears "unsaved changes" if nothing changed while it ran.
  const [changes, setChanges] = useState(0);
  const changesRef = useRef(0);

  const markDirty = useCallback(() => {
    changesRef.current += 1;
    setChanges(changesRef.current);
    setDirty(true);
  }, []);

  const { editor, insertImages } = useRichTextEditor({
    content: post?.content || "",
    placeholder: "Start writing your article here…",
    onUpdate: (e) => {
      setWords(countWords(e.getText()));
      markDirty();
    },
    // Offer to bring back unsaved work left in this browser (e.g. the tab closed before a save).
    onCreate: (e: Editor) => {
      const found = readBackup(post?.id ?? null);
      if (!found) return;
      const differs = found.title !== (post?.title || "") || found.excerpt !== (post?.excerpt || "") || found.content !== e.getHTML();
      const newer = !post || found.savedAt > new Date(post.updatedAt).getTime();
      if (differs && newer) setBackup(found);
      else clearBackups(post?.id ?? null);
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

  // Keep a copy of unsaved writing in this browser, a second after each change.
  useEffect(() => {
    if (!dirty || !editor) return;
    const timer = setTimeout(() => {
      try {
        const copy: Backup = { title, excerpt, content: editor.getHTML(), savedAt: Date.now() };
        localStorage.setItem(backupKey(postId), JSON.stringify(copy));
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [changes, dirty, editor, title, excerpt, postId]);

  const save = useCallback(
    async (newStatus: string, { autosave = false }: { autosave?: boolean } = {}) => {
      if (saving) return;
      if (!title.trim()) {
        if (!autosave) showToast("Please add a title.", "error");
        return;
      }
      setSaving(true);
      const startedAt = changesRef.current;

      const payload = {
        autosave,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: !editor || editor.isEmpty ? "" : editor.getHTML(),
        coverImage,
        status: newStatus,
        author: author.trim(),
        ...(canChooseAuthor && { authorId }),
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
        if (autosave) setAutosaveFailed(true);
        else showToast("This post is too large to save — try removing or using URLs for some images.", "error");
        return;
      }

      const res = await fetch(postId ? `/api/posts/${postId}` : "/api/posts", {
        method: postId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }).catch(() => null);
      setSaving(false);

      if (!res || !res.ok) {
        if (autosave) {
          setAutosaveFailed(true);
          return;
        }
        const data = res ? await res.json().catch(() => ({})) : {};
        showToast(data.error || "Network error — your changes were not saved.", "error");
        return;
      }

      const saved = await res.json();
      setAutosaveFailed(false);
      setSavedStatus(newStatus);
      setStatus((s) => (autosave ? s : newStatus));
      setSavedPublishedAt(saved.publishedAt ? new Date(saved.publishedAt) : null);
      setLastSaved({ at: Date.now(), auto: autosave });
      setSlug(saved.slug);
      if (changesRef.current === startedAt) {
        setDirty(false);
        clearBackups(postId, saved.id);
      }
      if (!postId) {
        // Stay on this page (no reload, so the cursor stays put) but give it the post's own address.
        setPostId(saved.id);
        window.history.replaceState(null, "", `/admin/posts/${saved.id}`);
      }
      if (autosave) return;

      const goesLiveLater = newStatus === "published" && saved.publishedAt && new Date(saved.publishedAt) > new Date();
      showToast(
        goesLiveLater
          ? `Scheduled for ${new Date(saved.publishedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`
          : newStatus === "published"
            ? "Post published!"
            : "Draft saved."
      );
      if (newStatus === "published" && saved.publishedAt) setPublishDate(toLocalInput(saved.publishedAt));
    },
    [saving, title, excerpt, editor, coverImage, author, canChooseAuthor, authorId, categoryId, slug, publishDate, tagInput, seoTitle, seoDescription, ogImage, postId, showToast]
  );

  // Drafts save themselves a few seconds after typing stops. Published posts don't,
  // so half-finished edits never go live; their changes are kept in this browser instead.
  const canAutosave = savedStatus === "draft" && status === "draft";
  useEffect(() => {
    if (!dirty || !canAutosave || saving || !title.trim()) return;
    const timer = setTimeout(() => void save("draft", { autosave: true }), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [changes, dirty, canAutosave, saving, title, save]);

  const restoreContent = (next: { title: string; excerpt: string; content: string }) => {
    setTitle(next.title);
    setExcerpt(next.excerpt);
    editor?.commands.setContent(next.content);
    setWords(countWords(editor?.getText() || ""));
    markDirty();
  };

  const restoreRevision = (revision: Revision) => {
    restoreContent(revision);
    const when = new Date(revision.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    showToast(canAutosave ? `Restored the version from ${when}.` : `Restored the version from ${when}. Update the post to keep it.`);
  };

  const scheduled = !!publishDate && new Date(publishDate) > new Date();
  const isLiveNow = savedStatus === "published" && !!savedPublishedAt && savedPublishedAt <= new Date();
  const metaTitle = seoTitle.trim() || title.trim() || "Post title";
  const metaDescription = seoDescription.trim() || excerpt.trim() || "Add an excerpt or meta description to control this text.";
  const creditedName = team.find((m) => m.id === authorId)?.name || siteAuthorName;
  const saveState = saving
    ? "Saving…"
    : autosaveFailed
      ? "Couldn't save automatically. Your changes are kept in this browser."
      : dirty
        ? canAutosave
          ? "Unsaved changes"
          : "Unsaved changes (kept in this browser until you update)"
        : lastSaved
          ? `${lastSaved.auto ? "Saved automatically" : "Saved"} at ${timeOf(lastSaved.at)}`
          : postId
            ? "All changes saved"
            : "";

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
    if (!postId) return;
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setDirty(false);
      clearBackups(postId);
      router.push("/admin");
    } else {
      showToast("Failed to delete post.", "error");
    }
  };

  return (
    <>
      {backup && (
        <div className="admin-alert editor-backup" role="alert">
          <span>
            <strong>Unsaved changes found.</strong> This browser kept edits from {new Date(backup.savedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} that were never saved.
          </span>
          <span className="editor-backup__actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                restoreContent(backup);
                setBackup(null);
              }}
            >
              Restore them
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                clearBackups(postId);
                setBackup(null);
              }}
            >
              Discard
            </button>
          </span>
        </div>
      )}
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
                <span aria-live="polite">{saveState}{saveState ? " · " : ""}Ctrl/⌘+S to save</span>
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
              {postId && (
                <Link
                  href={isLiveNow ? `/post/${slug}` : `/admin/posts/${postId}/preview`}
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
              {canChooseAuthor && (
                <div className="form-group">
                  <label htmlFor="postAuthorId">Written by</label>
                  <select id="postAuthorId" value={authorId} onChange={(e) => { setAuthorId(e.target.value); markDirty(); }}>
                    <option value="">{siteAuthorName} (blog author from Settings)</option>
                    {team.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="postAuthor">Guest author</label>
                <input type="text" id="postAuthor" placeholder={creditedName || "Author name"} value={author} onChange={(e) => { setAuthor(e.target.value); markDirty(); }} />
                <small className="field-hint">Leave empty to show {creditedName || "the author"}. Fill in only for a guest writer.</small>
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

          {postId && (
            <RevisionHistory postId={postId} onRestore={restoreRevision} onError={(m) => showToast(m, "error")} />
          )}

          {postId && (
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
