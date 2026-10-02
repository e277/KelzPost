"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Page } from "@/db/schema";
import { useToast } from "@/components/toast";
import { slugify } from "@/lib/utils";

const TOOLBAR: { cmd: string; title: string; label: React.ReactNode }[] = [
  { cmd: "bold", title: "Bold", label: <b>B</b> },
  { cmd: "italic", title: "Italic", label: <i>I</i> },
  { cmd: "underline", title: "Underline", label: <u>U</u> },
];

export function PageEditor({ page }: { page: Page | null }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(page?.title || "");
  const [slug, setSlug] = useState(page?.slug || "");
  const [slugEdited, setSlugEdited] = useState(!!page);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (editorRef.current && page?.content) {
      editorRef.current.innerHTML = page.content;
    }
  }, [page]);

  const runCmd = (cmd: string) => {
    editorRef.current?.focus();
    if (cmd === "h2") document.execCommand("formatBlock", false, "h2");
    else if (cmd === "h3") document.execCommand("formatBlock", false, "h3");
    else if (cmd === "blockquote") document.execCommand("formatBlock", false, "blockquote");
    else if (cmd === "createLink") {
      const url = prompt("Enter URL:");
      if (url) document.execCommand("createLink", false, url);
    } else document.execCommand(cmd, false);
  };

  const save = async () => {
    if (!title.trim()) { showToast("Please add a title.", "error"); return; }

    const payload = { title: title.trim(), slug: slug.trim(), content: editorRef.current?.innerHTML || "" };
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

              <div className="editor-toolbar">
                {TOOLBAR.map((b) => (
                  <button key={b.cmd} type="button" className="toolbar-btn" title={b.title} onMouseDown={(e) => { e.preventDefault(); runCmd(b.cmd); }}>
                    {b.label}
                  </button>
                ))}
                <div className="toolbar-sep" />
                <button type="button" className="toolbar-btn" title="Heading 2" onMouseDown={(e) => { e.preventDefault(); runCmd("h2"); }}>H2</button>
                <button type="button" className="toolbar-btn" title="Heading 3" onMouseDown={(e) => { e.preventDefault(); runCmd("h3"); }}>H3</button>
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
                <div className="toolbar-sep" />
                <button type="button" className="toolbar-btn" title="Clear Formatting" onMouseDown={(e) => { e.preventDefault(); runCmd("removeFormat"); }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} width="14" height="14">
                    <path d="M6 4l8 12M4 4h12" />
                  </svg>
                </button>
              </div>

              <div ref={editorRef} className="editor-area" contentEditable data-placeholder="Write your page content here…" />
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
