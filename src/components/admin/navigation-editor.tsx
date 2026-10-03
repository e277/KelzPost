"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

type NavLink = { label: string; href: string };

function parseNavLinks(raw: string): NavLink[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((l) => l.label && l.href);
  } catch {}
  return [{ label: "Home", href: "/" }, { label: "About", href: "/about" }];
}

// The site header's links, edited on Admin → Pages next to the pages they point to.
export function NavigationEditor({ navLinks: raw, pages }: { navLinks: string; pages: NavLink[] }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [navLinks, setNavLinks] = useState<NavLink[]>(parseNavLinks(raw));
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (next: NavLink[]) => {
    setNavLinks(next);
    setDirty(true);
  };

  const addLink = (label: string, href: string) => {
    if (!label.trim() || !href.trim()) return;
    update([...navLinks, { label: label.trim(), href: href.trim() }]);
  };

  const addTyped = () => {
    addLink(newLabel, newHref);
    setNewLabel("");
    setNewHref("");
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= navLinks.length) return;
    const next = [...navLinks];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ navLinks: JSON.stringify(navLinks) }),
    });
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      showToast("Navigation saved.");
      router.refresh();
    } else {
      showToast("Failed to save navigation.", "error");
    }
  };

  // Pages (and Home) that aren't in the menu yet, for one-click adding.
  const linked = new Set(navLinks.map((l) => l.href));
  const suggestions = [{ label: "Home", href: "/" }, ...pages].filter((p) => !linked.has(p.href));

  return (
    <section className="editor-card nav-editor">
      <div className="editor-card__header">Site Navigation</div>
      <div className="editor-card__body">
        <p className="settings-section-note">
          The links in your blog&apos;s header, in this order. Visitors reach /admin directly; there is no admin link on the public site.
        </p>
        <div className="nav-links-list">
          {navLinks.length === 0 && (
            <p className="settings-section-note" style={{ margin: 0 }}>No links yet. Add one below.</p>
          )}
          {navLinks.map((link, i) => (
            <div className="nav-link-row" key={i}>
              <span className="nav-link-row__label">{link.label}</span>
              <span className="nav-link-row__href">{link.href}</span>
              <div className="nav-link-row__actions">
                <button type="button" className="btn btn--ghost btn--sm" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" className="btn btn--ghost btn--sm" title="Move down" onClick={() => move(i, 1)} disabled={i === navLinks.length - 1}>↓</button>
                <button type="button" className="btn btn--ghost btn--sm" title="Remove" onClick={() => update(navLinks.filter((_, idx) => idx !== i))}>✕</button>
              </div>
            </div>
          ))}
        </div>
        {suggestions.length > 0 && (
          <div className="nav-editor__suggest">
            <span>Add a page:</span>
            {suggestions.map((p) => (
              <button key={p.href} type="button" className="filter-btn" onClick={() => addLink(p.label, p.href)}>
                + {p.label}
              </button>
            ))}
          </div>
        )}
        <div className="nav-link-add-row">
          <input
            type="text"
            placeholder="Label (e.g. Newsletter)"
            aria-label="Link label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTyped(); } }}
          />
          <input
            type="text"
            placeholder="URL (e.g. /category/news or https://…)"
            aria-label="Link address"
            value={newHref}
            onChange={(e) => setNewHref(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTyped(); } }}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={addTyped}>Add</button>
        </div>
        <div className="nav-editor__save">
          <button type="button" className="btn btn--primary btn--sm" disabled={saving || !dirty} onClick={save}>
            {saving ? "Saving…" : "Save Navigation"}
          </button>
          {dirty && <span className="field-hint">Unsaved changes</span>}
        </div>
      </div>
      {toastElement}
    </section>
  );
}
