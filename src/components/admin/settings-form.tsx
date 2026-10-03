"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Settings } from "@/db/schema";
import { useToast } from "@/components/toast";
import { apiSend } from "@/lib/admin-api";
import { AdminCard, Field, LabelNote } from "./ui";

/**
 * How the blog looks: name, colors, homepage hero and layout, social links and footer.
 * Content lives elsewhere: pages and the header menu under Pages, categories and tags
 * under Categories, and each person's name and password under Your Profile.
 */
export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();

  const [blogTitle, setBlogTitle] = useState(settings.blogTitle);
  const [tagline, setTagline] = useState(settings.tagline);
  const [logoText, setLogoText] = useState(settings.logoText ?? "");
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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiSend(
      "/api/settings",
      "PUT",
      {
        blogTitle: blogTitle.trim() || "The Journal",
        tagline: tagline.trim(),
        logoText: logoText.trim(),
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
      },
      "Failed to save settings."
    );
    setSaving(false);
    if (!res.ok) return showToast(res.error, "error");
    showToast("Settings saved.");
    router.refresh();
  };

  return (
    <>
      <div className="settings-grid">
        <AdminCard title="Blog Identity">
          <Field label="Blog Title" htmlFor="blogTitle">
            <input type="text" id="blogTitle" placeholder="The Journal" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} />
          </Field>
          <Field label={<>Logo Text <LabelNote>(overrides title in logo)</LabelNote></>} htmlFor="logoText">
            <input type="text" id="logoText" placeholder="Leave blank to use Blog Title" value={logoText} onChange={(e) => setLogoText(e.target.value)} />
          </Field>
          <Field label="Tagline" htmlFor="tagline">
            <textarea id="tagline" rows={2} placeholder="Thoughts, stories, and ideas — written to share." value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </Field>
        </AdminCard>

        <AdminCard title="Branding">
          <Field label="Accent Color" htmlFor="accentColor">
            <ColorInput id="accentColor" value={accentColor} fallback="#C8922A" onChange={setAccentColor} />
          </Field>
          <Field label="Primary Color" htmlFor="navyColor">
            <ColorInput id="navyColor" value={navyColor} fallback="#0A1F44" onChange={setNavyColor} />
          </Field>
        </AdminCard>

        <AdminCard title="Hero Section">
          <Field label={<>Tag Label <LabelNote>(small text above title)</LabelNote></>} htmlFor="heroTag">
            <input type="text" id="heroTag" placeholder="Personal Blog" value={heroTag} onChange={(e) => setHeroTag(e.target.value)} />
          </Field>
          <Field label="Layout">
            <LayoutChoice
              name="heroLayout"
              value={heroLayout}
              onChange={setHeroLayout}
              options={[
                { value: "centered", icon: "⊞", label: "Centered" },
                { value: "split", icon: "⊟", label: "Split" },
              ]}
            />
          </Field>
        </AdminCard>

        <AdminCard title="Posts Layout">
          <Field label="How posts are displayed on the homepage">
            <LayoutChoice
              name="postsLayout"
              value={postsLayout}
              onChange={setPostsLayout}
              options={[
                { value: "grid", icon: "⊞", label: "Grid" },
                { value: "list", icon: "☰", label: "List" },
              ]}
            />
          </Field>
        </AdminCard>

        <AdminCard title="Social Links">
          <Field label="Twitter / X" htmlFor="socialTwitter">
            <input type="url" id="socialTwitter" placeholder="https://twitter.com/yourhandle" value={socialTwitter} onChange={(e) => setSocialTwitter(e.target.value)} />
          </Field>
          <Field label="Instagram" htmlFor="socialInstagram">
            <input type="url" id="socialInstagram" placeholder="https://instagram.com/yourhandle" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} />
          </Field>
          <Field label="LinkedIn" htmlFor="socialLinkedin">
            <input type="url" id="socialLinkedin" placeholder="https://linkedin.com/in/yourname" value={socialLinkedin} onChange={(e) => setSocialLinkedin(e.target.value)} />
          </Field>
          <Field label="GitHub" htmlFor="socialGithub">
            <input type="url" id="socialGithub" placeholder="https://github.com/yourname" value={socialGithub} onChange={(e) => setSocialGithub(e.target.value)} />
          </Field>
        </AdminCard>

        <AdminCard title="Footer">
          <Field label={<>Copyright Text <LabelNote>(leave blank for default)</LabelNote></>} htmlFor="footerText">
            <input
              type="text"
              id="footerText"
              placeholder={`© ${new Date().getFullYear()} ${settings.authorName || "Author"}. All rights reserved.`}
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
            />
          </Field>
        </AdminCard>
      </div>

      <div className="admin-save-bar">
        <button type="button" className="btn btn--primary btn--sm" disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {toastElement}
    </>
  );
}

function ColorInput({ id, value, fallback, onChange }: { id: string; value: string; fallback: string; onChange: (v: string) => void }) {
  return (
    <div className="color-field">
      <input type="color" aria-label="Pick a color" value={value || fallback} onChange={(e) => onChange(e.target.value)} />
      <input type="text" id={id} placeholder={fallback} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function LayoutChoice({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: { value: string; icon: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="layout-options">
      {options.map((o) => (
        <label key={o.value} className={`layout-option${value === o.value ? " active" : ""}`}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span className="layout-option__icon">{o.icon}</span>
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}
