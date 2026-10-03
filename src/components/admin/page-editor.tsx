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
import { AdminCard, ConfirmDialog, Field, LabelNote } from "./ui";

// The blog's main author, shown at the top of the About page; stored in settings.
type AuthorProfile = { name: string; bio: string; avatar: string };

const CONTENT_NOTES: Record<string, string> = {
  home: "Optional. Shown between the hero and your posts, on the first page of the home page only.",
  about: "Shown under your author photo, name and bio.",
};

/**
 * Editor for every page: custom pages, and the built-in Home (/) and About
 * (/about), which keep their addresses and can't be deleted. Home's heading and
 * subheading fall back to the blog's title and tagline (`defaults`).
 */
export function PageEditor({
  page,
  inNav = true,
  defaults,
  author,
}: {
  page: Page | null;
  inNav?: boolean;
  defaults?: { heading: string; subheading: string };
  author?: AuthorProfile;
}) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const kind = page?.kind ?? "custom";
  const builtIn = kind !== "custom";
  const { editor, insertImages } = useRichTextEditor({
    content: page?.content || "",
    placeholder: kind === "home" ? "An optional introduction above your posts…" : "Write your page content here…",
    uploadImage,
    onError: (m) => showToast(m, "error"),
  });

  const [title, setTitle] = useState(page?.title || "");
  const [slug, setSlug] = useState(page?.slug || "");
  const [slugEdited, setSlugEdited] = useState(!!page);
  const [eyebrow, setEyebrow] = useState(page?.eyebrow || "");
  const [heading, setHeading] = useState(page?.heading || "");
  const [subheading, setSubheading] = useState(page?.subheading || "");
  const [seoTitle, setSeoTitle] = useState(page?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(page?.seoDescription || "");
  const [authorName, setAuthorName] = useState(author?.name || "");
  const [authorBio, setAuthorBio] = useState(author?.bio || "");
  const [authorAvatar, setAuthorAvatar] = useState(author?.avatar || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  // The page's header link is created, renamed and removed along with the page.
  const [showInNav, setShowInNav] = useState(inNav);

  const href = kind === "home" ? "/" : `/${slug}`;
  const headingFallback = kind === "home" ? defaults?.heading : title;

  const save = async () => {
    if (!title.trim()) return showToast("Please add a title.", "error");
    setSaving(true);

    const content = !editor || editor.isEmpty ? "" : editor.getHTML();
    const payload = { title: title.trim(), slug: slug.trim(), content, showInNav, eyebrow, heading, subheading, seoTitle, seoDescription };
    const res = await apiSend<{ id: string }>(page ? `/api/pages/${page.id}` : "/api/pages", page ? "PUT" : "POST", payload, "Failed to save page.");
    if (!res.ok) {
      setSaving(false);
      return showToast(res.error, "error");
    }

    if (author) {
      const saved = await apiSend(
        "/api/settings",
        "PUT",
        { authorName: authorName.trim() || "Author", authorBio: authorBio.trim(), authorAvatar },
        "The page was saved, but the author details weren't."
      );
      if (!saved.ok) {
        setSaving(false);
        return showToast(saved.error, "error");
      }
    }

    setSaving(false);
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
              aria-label="Page title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugEdited && !builtIn) setSlug(slugify(e.target.value));
              }}
            />

            {builtIn ? (
              <p className="settings-section-note editor-slug">
                Built-in page at <code>{href}</code>. The title is its name in the header menu and browser tab.
                {kind === "about" && " Your author photo, name and bio from the panel on the right appear above the content."}
              </p>
            ) : (
              <Field label="URL slug" htmlFor="pageSlug" hint={`/${slug || "page-slug"}`}>
                <input
                  type="text"
                  id="pageSlug"
                  placeholder="page-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(slugify(e.target.value));
                  }}
                />
              </Field>
            )}

            {CONTENT_NOTES[kind] && <p className="settings-section-note">{CONTENT_NOTES[kind]}</p>}
            <RichTextEditor editor={editor} insertImages={insertImages} onError={(m) => showToast(m, "error")} />
          </AdminCard>
        </div>

        <div className="sidebar-panel">
          <AdminCard title="Actions">
            <label className="checkbox-row">
              <input type="checkbox" checked={showInNav} onChange={(e) => setShowInNav(e.target.checked)} />
              Show in the site&apos;s navigation
            </label>
            <div className="editor-actions">
              <button type="button" className="btn btn--primary btn--sm" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save Page"}
              </button>
            </div>
            {(page || slug) && (
              <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm btn--full editor-view-link">
                View page ↗
              </a>
            )}
          </AdminCard>

          <AdminCard title={kind === "home" ? "Hero" : "Page Heading"}>
            <Field label={<>Small label <LabelNote>(above the heading)</LabelNote></>} htmlFor="pageEyebrow">
              <input type="text" id="pageEyebrow" maxLength={80} placeholder="Optional" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
            </Field>
            <Field label="Heading" htmlFor="pageHeading" hint={headingFallback ? `Leave blank to use “${headingFallback}”.` : undefined}>
              <input type="text" id="pageHeading" maxLength={200} placeholder={headingFallback || ""} value={heading} onChange={(e) => setHeading(e.target.value)} />
            </Field>
            <Field
              label={<>Subheading <LabelNote>(under the heading)</LabelNote></>}
              htmlFor="pageSubheading"
              hint={kind === "home" && defaults?.subheading ? "Leave blank to use your blog's tagline." : undefined}
            >
              <textarea
                id="pageSubheading"
                rows={3}
                maxLength={400}
                placeholder={kind === "home" ? defaults?.subheading : "Optional"}
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
              />
            </Field>
          </AdminCard>

          {author && (
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

          <AdminCard title="Search & Sharing">
            <Field label="SEO title" htmlFor="pageSeoTitle" hint="Shown in search results and browser tabs. Leave blank to use the page title.">
              <input type="text" id="pageSeoTitle" maxLength={120} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </Field>
            <Field label="Description" htmlFor="pageSeoDescription" hint={`${seoDescription.length}/300 — the summary under the link in search results.`}>
              <textarea id="pageSeoDescription" rows={3} maxLength={300} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
            </Field>
          </AdminCard>

          {page && !builtIn && (
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
