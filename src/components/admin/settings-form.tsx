"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Settings } from "@prisma/client";
import { useToast } from "@/components/toast";
import { ImageUpload } from "./image-upload";

type NavLink = { label: string; href: string };

const ABOUT_TOOLBAR: { cmd: string; title: string; label: React.ReactNode }[] = [
  { cmd: "bold", title: "Bold", label: <b>B</b> },
  { cmd: "italic", title: "Italic", label: <i>I</i> },
  { cmd: "underline", title: "Underline", label: <u>U</u> },
];

function parseNavLinks(raw: string): NavLink[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((l) => l.label && l.href);
  } catch {}
  return [{ label: "Home", href: "/" }, { label: "About", href: "/about" }];
}

export function SettingsForm({ settings, categories }: { settings: Settings; categories: Category[] }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const aboutRef = useRef<HTMLDivElement>(null);

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
  const [aboutTitle, setAboutTitle] = useState(settings.aboutTitle);

  // Navigation
  const [navLinks, setNavLinks] = useState<NavLink[]>(parseNavLinks(settings.navLinks));
  const [newNavLabel, setNewNavLabel] = useState("");
  const [newNavHref, setNewNavHref] = useState("");

  // Hero
  const [heroTag, setHeroTag] = useState(settings.heroTag ?? "Personal Blog");
  const [heroLayout, setHeroLayout] = useState(settings.heroLayout ?? "centered");

  // Layout
  const [postsLayout, setPostsLayout] = useState(settings.postsLayout ?? "grid");

  // Footer
  const [footerText, setFooterText] = useState(settings.footerText ?? "");

  const [cats, setCats] = useState(categories);
  const [newCategory, setNewCategory] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (aboutRef.current) aboutRef.current.innerHTML = settings.aboutContent || "";
  }, [settings.aboutContent]);

  const runAboutCmd = (cmd: string) => {
    aboutRef.current?.focus();
    if (cmd === "h2") document.execCommand("formatBlock", false, "h2");
    else if (cmd === "createLink") {
      const url = prompt("Enter URL:");
      if (url) document.execCommand("createLink", false, url);
    } else document.execCommand(cmd, false);
  };

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
        aboutTitle: aboutTitle.trim() || "About",
        aboutContent: aboutRef.current?.innerHTML || "",
        navLinks: JSON.stringify(navLinks),
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

  // Nav link helpers
  const addNavLink = () => {
    const label = newNavLabel.trim();
    const href = newNavHref.trim();
    if (!label || !href) return;
    setNavLinks((prev) => [...prev, { label, href }]);
    setNewNavLabel("");
    setNewNavHref("");
  };

  const removeNavLink = (i: number) => setNavLinks((prev) => prev.filter((_, idx) => idx !== i));

  const moveNavLink = (i: number, dir: -1 | 1) => {
    setNavLinks((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
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

  const changePassword = async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated.");
    } else {
      const data = await res.json().catch(() => ({}));
      setPasswordError(data.error || "Failed to update password.");
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

        {/* Navigation */}
        <div className="editor-card settings-grid--full">
          <div className="editor-card__header">Navigation Links</div>
          <div className="editor-card__body">
            <p className="settings-section-note">These links appear in the site header. Visitors navigate to /admin directly — there is no admin button on the public site.</p>
            <div className="nav-links-list">
              {navLinks.length === 0 && (
                <p className="settings-section-note" style={{ margin: 0 }}>No links yet. Add one below.</p>
              )}
              {navLinks.map((link, i) => (
                <div className="nav-link-row" key={i}>
                  <span className="nav-link-row__label">{link.label}</span>
                  <span className="nav-link-row__href">{link.href}</span>
                  <div className="nav-link-row__actions">
                    <button className="btn btn--ghost btn--sm" title="Move up" onClick={() => moveNavLink(i, -1)} disabled={i === 0}>↑</button>
                    <button className="btn btn--ghost btn--sm" title="Move down" onClick={() => moveNavLink(i, 1)} disabled={i === navLinks.length - 1}>↓</button>
                    <button className="btn btn--ghost btn--sm" title="Remove" onClick={() => removeNavLink(i)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="nav-link-add-row">
              <input
                type="text"
                placeholder="Label (e.g. Home)"
                value={newNavLabel}
                onChange={(e) => setNewNavLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNavLink(); } }}
              />
              <input
                type="text"
                placeholder="URL (e.g. /about)"
                value={newNavHref}
                onChange={(e) => setNewNavHref(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNavLink(); } }}
              />
              <button className="btn btn--ghost btn--sm" onClick={addNavLink}>Add</button>
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

        {/* Security */}
        <div className="editor-card">
          <div className="editor-card__header">Security</div>
          <div className="editor-card__body">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input type="password" id="newPassword" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input type="password" id="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <p className={`form-error${passwordError ? " visible" : ""}`} style={{ marginTop: 14 }}>
              {passwordError}
            </p>
            <button className="btn btn--ghost btn--sm" style={{ marginTop: 10 }} onClick={changePassword}>
              Change Password
            </button>
          </div>
        </div>

        {/* About Page */}
        <div className="editor-card settings-grid--full">
          <div className="editor-card__header">About Page Content</div>
          <div className="editor-card__body">
            <div className="form-group">
              <label htmlFor="aboutTitle">Page Title</label>
              <input type="text" id="aboutTitle" placeholder="About" value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Content</label>
              <div className="editor-toolbar">
                {ABOUT_TOOLBAR.map((b) => (
                  <button key={b.cmd} type="button" className="toolbar-btn" title={b.title} onMouseDown={(e) => { e.preventDefault(); runAboutCmd(b.cmd); }}>
                    {b.label}
                  </button>
                ))}
                <div className="toolbar-sep" />
                <button type="button" className="toolbar-btn" title="Heading 2" onMouseDown={(e) => { e.preventDefault(); runAboutCmd("h2"); }}>H2</button>
                <button type="button" className="toolbar-btn" title="Bullet List" onMouseDown={(e) => { e.preventDefault(); runAboutCmd("insertUnorderedList"); }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path d="M4 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM7 4h10a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2zm0 6h10a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2zm0 6h10a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2z" />
                  </svg>
                </button>
                <div className="toolbar-sep" />
                <button type="button" className="toolbar-btn" title="Insert Link" onMouseDown={(e) => { e.preventDefault(); runAboutCmd("createLink"); }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} width="14" height="14">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </button>
                <button type="button" className="toolbar-btn" title="Clear Formatting" onMouseDown={(e) => { e.preventDefault(); runAboutCmd("removeFormat"); }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} width="14" height="14">
                    <path d="M6 4l8 12M4 4h12" />
                  </svg>
                </button>
              </div>
              <div ref={aboutRef} className="editor-area" contentEditable data-placeholder="Write something about yourself or this blog…" style={{ minHeight: 200 }} />
            </div>
          </div>
        </div>

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
