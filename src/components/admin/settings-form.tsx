"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Settings } from "@/db/schema";
import { useToast } from "@/components/toast";
import { ImageUpload } from "./image-upload";
import { PasswordForm } from "./password-form";

type TagSummary = { id: string; name: string; posts: number };

export function SettingsForm({
  settings,
  categories,
  tags,
}: {
  settings: Settings;
  categories: Category[];
  tags: TagSummary[];
}) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();

  const [blogTitle, setBlogTitle] = useState(settings.blogTitle);
  const [tagline, setTagline] = useState(settings.tagline);
  const [logoText, setLogoText] = useState(settings.logoText ?? "");
  const [authorName, setAuthorName] = useState(settings.authorName);
  const [authorBio, setAuthorBio] = useState(settings.authorBio);
  const [authorAvatar, setAuthorAvatar] = useState(settings.authorAvatar);
  const [accentColor, setAccentColor] = useState(settings.accentColor);
  const [navyColor, setNavyColor] = useState(settings.navyColor);
  const [socialTwitter, setSocialTwitter] = useState(settings.socialTwitter);
  const [socialInstagram, setSocialInstagram] = useState(settings.socialInstagram);
  const [socialLinkedin, setSocialLinkedin] = useState(settings.socialLinkedin);
  const [socialGithub, setSocialGithub] = useState(settings.socialGithub);

  // Hero
  const [heroTag, setHeroTag] = useState(settings.heroTag ?? "Personal Blog");
  const [heroLayout, setHeroLayout] = useState(settings.heroLayout ?? "centered");

  // Layout
  const [postsLayout, setPostsLayout] = useState(settings.postsLayout ?? "grid");

  // Footer
  const [footerText, setFooterText] = useState(settings.footerText ?? "");

  const [cats, setCats] = useState(categories);
  const [newCategory, setNewCategory] = useState("");
  const [tagList, setTagList] = useState(tags);


  const handleSave = async () => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blogTitle: blogTitle.trim() || "The Journal",
        tagline: tagline.trim(),
        logoText: logoText.trim(),
        authorName: authorName.trim() || "Author",
        authorBio: authorBio.trim(),
        authorAvatar,
        accentColor: accentColor.trim() || "#C8922A",
        navyColor: navyColor.trim() || "#0A1F44",
        socialTwitter: socialTwitter.trim(),
        socialInstagram: socialInstagram.trim(),
        socialLinkedin: socialLinkedin.trim(),
        socialGithub: socialGithub.trim(),
        heroTag: heroTag.trim(),
        heroLayout,
        postsLayout,
        footerText: footerText.trim(),
      }),
    });

    if (res.ok) {
      showToast("Settings saved.");
      router.refresh();
    } else {
      showToast("Failed to save settings.", "error");
    }
  };

  const addCategory = async () => {
    const value = newCategory.trim();
    if (!value) return;
    if (cats.some((c) => c.name.toLowerCase() === value.toLowerCase())) {
      showToast("That category already exists.", "error");
      return;
    }
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value }),
    });
    if (res.ok) {
      const created = await res.json();
      setCats((c) => [...c, created]);
      setNewCategory("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "Failed to add category.", "error");
    }
  };

  const removeCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCats((c) => c.filter((cat) => cat.id !== id));
      router.refresh();
    } else {
      showToast("Failed to remove category.", "error");
    }
  };

  const removeTag = async (tag: TagSummary) => {
    if (tag.posts > 0 && !confirm(`Remove “${tag.name}” from ${tag.posts} post${tag.posts === 1 ? "" : "s"}?`)) return;
    const res = await fetch(`/api/tags/${tag.id}`, { method: "DELETE" });
    if (res.ok) {
      setTagList((t) => t.filter((x) => x.id !== tag.id));
      router.refresh();
    } else {
      showToast("Failed to remove tag.", "error");
    }
  };

  return (
    <>
      <div className="settings-grid">

        {/* Blog Identity */}
        <div className="editor-card">
          <div className="editor-card__header">Blog Identity</div>
          <div className="editor-card__body">
            <div className="form-group">
              <label htmlFor="blogTitle">Blog Title</label>
              <input type="text" id="blogTitle" placeholder="The Journal" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="logoText">Logo Text <span style={{ fontWeight: 400, opacity: 0.6 }}>(overrides title in logo)</span></label>
              <input type="text" id="logoText" placeholder="Leave blank to use Blog Title" value={logoText} onChange={(e) => setLogoText(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="tagline">Tagline</label>
              <textarea id="tagline" rows={2} placeholder="Thoughts, stories, and ideas — written to share." value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="editor-card">
          <div className="editor-card__header">Branding</div>
          <div className="editor-card__body">
            <div className="form-group">
              <label htmlFor="accentColor">Accent Color</label>
              <div className="color-field">
                <input type="color" value={accentColor || "#C8922A"} onChange={(e) => setAccentColor(e.target.value)} />
                <input type="text" id="accentColor" placeholder="#C8922A" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="navyColor">Primary Color</label>
              <div className="color-field">
                <input type="color" value={navyColor || "#0A1F44"} onChange={(e) => setNavyColor(e.target.value)} />
                <input type="text" id="navyColor" placeholder="#0A1F44" value={navyColor} onChange={(e) => setNavyColor(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="editor-card">
          <div className="editor-card__header">Hero Section</div>
          <div className="editor-card__body">
            <div className="form-group">
              <label htmlFor="heroTag">Tag Label <span style={{ fontWeight: 400, opacity: 0.6 }}>(small text above title)</span></label>
              <input type="text" id="heroTag" placeholder="Personal Blog" value={heroTag} onChange={(e) => setHeroTag(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Layout</label>
              <div className="layout-options">
                <label className={`layout-option${heroLayout === "centered" ? " active" : ""}`}>
                  <input type="radio" name="heroLayout" value="centered" checked={heroLayout === "centered"} onChange={() => setHeroLayout("centered")} />
                  <span className="layout-option__icon">⊞</span>
                  <span>Centered</span>
                </label>
                <label className={`layout-option${heroLayout === "split" ? " active" : ""}`}>
                  <input type="radio" name="heroLayout" value="split" checked={heroLayout === "split"} onChange={() => setHeroLayout("split")} />
                  <span className="layout-option__icon">⊟</span>
                  <span>Split</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Layout */}
        <div className="editor-card">
          <div className="editor-card__header">Posts Layout</div>
          <div className="editor-card__body">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>How posts are displayed on the homepage</label>
              <div className="layout-options">
                <label className={`layout-option${postsLayout === "grid" ? " active" : ""}`}>
                  <input type="radio" name="postsLayout" value="grid" checked={postsLayout === "grid"} onChange={() => setPostsLayout("grid")} />
                  <span className="layout-option__icon">⊞</span>
                  <span>Grid</span>
                </label>
                <label className={`layout-option${postsLayout === "list" ? " active" : ""}`}>
                  <input type="radio" name="postsLayout" value="list" checked={postsLayout === "list"} onChange={() => setPostsLayout("list")} />
                  <span className="layout-option__icon">☰</span>
                  <span>List</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Author */}
        <div className="editor-card">
          <div className="editor-card__header">Author Profile</div>
          <div className="editor-card__body">
            <div className="form-group">
              <label htmlFor="authorName">Author Name</label>
              <input type="text" id="authorName" placeholder="Author" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="authorBio">Bio</label>
              <textarea id="authorBio" rows={3} placeholder="A short bio shown on the About page…" value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} />
              <small className="field-hint">
                The blog&apos;s main author, shown on the About page and on posts by admins who haven&apos;t set a display name in{" "}
                <Link href="/admin/profile">Your Profile</Link>. Other writers manage their own name and bio there.
              </small>
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div className="editor-card">
          <div className="editor-card__header">Author Avatar</div>
          <div className="editor-card__body">
            <ImageUpload value={authorAvatar} onChange={setAuthorAvatar} round onError={(m) => showToast(m, "error")} />
          </div>
        </div>

        {/* Categories */}
        <div className="editor-card settings-grid--full">
          <div className="editor-card__header">Categories</div>
          <div className="editor-card__body">
            <p className="settings-section-note">Categories appear as filters on the blog and in the post editor&apos;s category dropdown.</p>
            <div className="tag-list">
              {cats.length === 0 ? (
                <p className="settings-section-note" style={{ margin: 0 }}>No categories yet. Add one below.</p>
              ) : (
                cats.map((c) => (
                  <span className="tag-chip" key={c.id}>
                    {c.name}
                    <button title="Remove" onClick={() => removeCategory(c.id)}>✕</button>
                  </span>
                ))
              )}
            </div>
            <div className="tag-add-row">
              <input
                type="text"
                placeholder="Add a category…"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
              />
              <button className="btn btn--ghost btn--sm" onClick={addCategory}>Add</button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="editor-card settings-grid--full">
          <div className="editor-card__header">Tags</div>
          <div className="editor-card__body">
            <p className="settings-section-note">
              Tags are added from the post editor and each one gets its own page on the blog. Remove tags you no longer use here.
            </p>
            <div className="tag-list" style={{ marginBottom: 0 }}>
              {tagList.length === 0 ? (
                <p className="settings-section-note" style={{ margin: 0 }}>No tags yet. Add some to a post in the editor.</p>
              ) : (
                tagList.map((t) => (
                  <span className="tag-chip" key={t.id}>
                    {t.name}
                    <span style={{ opacity: 0.55, fontWeight: 400 }}>{t.posts}</span>
                    <button type="button" title="Remove" onClick={() => removeTag(t)}>✕</button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="editor-card">
          <div className="editor-card__header">Social Links</div>
          <div className="editor-card__body">
            <div className="form-group">
              <label htmlFor="socialTwitter">Twitter / X</label>
              <input type="url" id="socialTwitter" placeholder="https://twitter.com/yourhandle" value={socialTwitter} onChange={(e) => setSocialTwitter(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="socialInstagram">Instagram</label>
              <input type="url" id="socialInstagram" placeholder="https://instagram.com/yourhandle" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="socialLinkedin">LinkedIn</label>
              <input type="url" id="socialLinkedin" placeholder="https://linkedin.com/in/yourname" value={socialLinkedin} onChange={(e) => setSocialLinkedin(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="socialGithub">GitHub</label>
              <input type="url" id="socialGithub" placeholder="https://github.com/yourname" value={socialGithub} onChange={(e) => setSocialGithub(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="editor-card">
          <div className="editor-card__header">Footer</div>
          <div className="editor-card__body">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="footerText">Copyright Text <span style={{ fontWeight: 400, opacity: 0.6 }}>(leave blank for default)</span></label>
              <input
                type="text"
                id="footerText"
                placeholder={`© ${new Date().getFullYear()} ${authorName || "Author"}. All rights reserved.`}
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
              />
            </div>
          </div>
        </div>

        <PasswordForm />
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn--primary btn--sm" onClick={handleSave}>
          Save Changes
        </button>
      </div>

      {toastElement}
    </>
  );
}
