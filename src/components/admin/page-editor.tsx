"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Page } from "@/db/schema";
import { useToast } from "@/components/toast";
import { uploadImage } from "@/lib/image";
import { apiSend } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import { ImageUpload } from "./image-upload";
import { RichTextEditor, useRichTextEditor } from "./rich-text-editor";
import { AdminCard, ConfirmDialog, Field } from "./ui";

// The About page is built in: it always lives at /about and shows the blog
// author's photo, name and bio above its content. All of it is stored in settings.
type AboutPage = { title: string; content: string; authorName: string; authorBio: string; authorAvatar: string };

export function PageEditor({ page, about }: { page: Page | null; about?: AboutPage }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const { editor, insertImages } = useRichTextEditor({
    content: (about ? about.content : page?.content) || "",
    placeholder: "Write your page content here…",
    uploadImage,
    onError: (m) => showToast(m, "error"),
  });

  const [title, setTitle] = useState((about ? about.title : page?.title) || "");
  const [slug, setSlug] = useState(about ? "about" : page?.slug || "");
  const [slugEdited, setSlugEdited] = useState(!!page);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [authorName, setAuthorName] = useState(about?.authorName || "");
  const [authorBio, setAuthorBio] = useState(about?.authorBio || "");
  const [authorAvatar, setAuthorAvatar] = useState(about?.authorAvatar || "");

  const save = async () => {
    if (!title.trim()) { showToast("Please add a title.", "error"); return; }

    const content = !editor || editor.isEmpty ? "" : editor.getHTML();
    if (about) {
      const res = await apiSend(
        "/api/settings",
        "PUT",
        {
          aboutTitle: title.trim(),
          aboutContent: content,
          authorName: authorName.trim() || "Author",
          authorBio: authorBio.trim(),
          authorAvatar,
        },
        "Failed to save page."
      );
      if (!res.ok) return showToast(res.error, "error");
      showToast("Page saved.");
      router.refresh();
      return;
    }

    const payload = { title: title.trim(), slug: slug.trim(), content };
    const res = await apiSend<{ id: string }>(page ? `/api/pages/${page.id}` : "/api/pages", page ? "PUT" : "POST", payload, "Failed to save page.");
    if (!res.ok) return showToast(res.error, "error");

    showToast("Page saved.");
    if (!page) router.replace(`/admin/pages/${res.data.id}`);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!page) return;
    const res = await apiSend(`/api/pages/${page.id}`, "DELETE", undefined, "Failed to delete page.");
    if (res.ok) router.push("/admin/pages");
    else showToast(res.error, "error");
  };

  return (
    <>
      <div className="editor-layout">
        <div>
          <AdminCard className="editor-card--main">
              <input
                type="text"
                className="editor-title"
                placeholder="Page title…"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugEdited && !about) setSlug(slugify(e.target.value));
                }}
              />

              {about ? (
                <p className="settings-section-note editor-slug">
                  Built-in page at <code>/about</code>. The author photo, name and bio from the panel on the
                  right appear above this content.
                </p>
              ) : (
              <Field label="URL slug" htmlFor="pageSlug" hint={`/${slug || "page-slug"}`}>
                <input
                  type="text"
                  id="pageSlug"
                  placeholder="page-slug"
                  value={slug}
                  onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
                />
              </Field>
              )}

              <RichTextEditor editor={editor} insertImages={insertImages} onError={(m) => showToast(m, "error")} />
          </AdminCard>
        </div>

        <div className="sidebar-panel">
          <AdminCard title="Actions">
            <div className="editor-actions">
              <button type="button" className="btn btn--primary btn--sm" onClick={save}>
                Save Page
              </button>
            </div>
            {slug && (
              <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm btn--full editor-view-link">
                View page ↗
              </a>
            )}
          </AdminCard>

          {about && (
            <AdminCard title="About the Author">
              <Field label="Name" htmlFor="authorName">
                <input type="text" id="authorName" placeholder="Author" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
              </Field>
              <Field label="Bio" htmlFor="authorBio">
                <textarea id="authorBio" rows={4} placeholder="A short bio shown at the top of this page…" value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} />
              </Field>
              <Field
                label="Photo"
                hint={
                  <>
                    This is the blog&apos;s main author. The name also shows on posts not credited to a team member. Other writers
                    set their own name and photo in <Link href="/admin/profile">Your Profile</Link>.
                  </>
                }
              >
                <ImageUpload value={authorAvatar} onChange={setAuthorAvatar} round onError={(m) => showToast(m, "error")} />
              </Field>
            </AdminCard>
          )}

          {page && (
            <AdminCard title="Danger Zone" danger>
              <button type="button" className="btn btn--danger btn--sm btn--full" onClick={() => setShowDeleteModal(true)}>
                Delete This Page
              </button>
            </AdminCard>
          )}
        </div>
      </div>

      <ConfirmDialog open={showDeleteModal} title="Delete Page?" onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)}>
        This will permanently delete this page and its content. This cannot be undone.
      </ConfirmDialog>

      {toastElement}
    </>
  );
}
