"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Page } from "@/db/schema";
import { useToast } from "@/components/toast";
import { uploadImage } from "@/lib/image";
import { slugify } from "@/lib/utils";
import { RichTextEditor, useRichTextEditor } from "./rich-text-editor";

export function PageEditor({ page }: { page: Page | null }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const { editor, insertImages } = useRichTextEditor({
    content: page?.content || "",
    placeholder: "Write your page content here…",
    uploadImage,
    onError: (m) => showToast(m, "error"),
  });

  const [title, setTitle] = useState(page?.title || "");
  const [slug, setSlug] = useState(page?.slug || "");
  const [slugEdited, setSlugEdited] = useState(!!page);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const save = async () => {
    if (!title.trim()) { showToast("Please add a title.", "error"); return; }

    const payload = { title: title.trim(), slug: slug.trim(), content: !editor || editor.isEmpty ? "" : editor.getHTML() };
    const res = await fetch(page ? `/api/pages/${page.id}` : "/api/pages", {
      method: page ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "Failed to save page.", "error");
      return;
    }

    showToast("Page saved.");
    if (!page) {
      const created = await res.json();
      router.replace(`/admin/pages/${created.id}`);
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!page) return;
    const res = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/pages");
    else showToast("Failed to delete page.", "error");
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
                placeholder="Page title…"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugEdited) setSlug(slugify(e.target.value));
                }}
              />

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label htmlFor="pageSlug" style={{ fontSize: ".8rem", color: "var(--gray-500)", fontWeight: 600 }}>
                  URL slug — will be accessible at <code>/{slug || "page-slug"}</code>
                </label>
                <input
                  type="text"
                  id="pageSlug"
                  placeholder="page-slug"
                  value={slug}
                  onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
                />
              </div>

              <RichTextEditor editor={editor} insertImages={insertImages} onError={(m) => showToast(m, "error")} />
            </div>
          </div>
        </div>

        <div className="sidebar-panel">
          <div className="editor-card">
            <div className="editor-card__header">Actions</div>
            <div className="editor-card__body">
              <button type="button" className="btn btn--primary btn--sm btn--full" onClick={save}>
                Save Page
              </button>
              {slug && (
                <a
                  href={`/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--ghost btn--sm btn--full"
                  style={{ marginTop: 10, display: "block", textAlign: "center" }}
                >
                  View Page →
                </a>
              )}
            </div>
          </div>

          {page && (
            <div className="editor-card">
              <div className="editor-card__header" style={{ color: "var(--red)" }}>Danger Zone</div>
              <div className="editor-card__body">
                <button type="button" className="btn btn--danger btn--sm btn--full" onClick={() => setShowDeleteModal(true)}>
                  Delete This Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`modal-overlay${showDeleteModal ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
        <div className="modal">
          <h2 className="modal__title">Delete Page?</h2>
          <p className="modal__body">This will permanently delete this page and its content. This cannot be undone.</p>
          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className="btn btn--danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>

      {toastElement}
    </>
  );
}
