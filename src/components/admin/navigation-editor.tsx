"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { apiSend } from "@/lib/admin-api";
import { AdminCard } from "./ui";

import { parseNavLinks, type NavLink } from "@/lib/nav-links";

type PageOption = { pageId: string; label: string; href: string };

// The site header's links, edited on Admin → Pages next to the pages they point to.
// Links to pages are created with the page (its "Show in navigation" option) and
// follow its title and address; links typed here are for anything else.
export function NavigationEditor({ navLinks: raw, pages }: { navLinks: string; pages: PageOption[] }) {
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

  const addPage = (p: PageOption) => update([...navLinks, { label: p.label, href: p.href, pageId: p.pageId }]);

  const addLink = (label: string, href: string) => {
    if (!label.trim() || !href.trim()) return;
    // A typed address of one of our pages becomes that page's link.
    const page = pages.find((p) => p.href === href.trim().replace(/\/+$/, ""));
    if (page) return addPage(page);
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
    const res = await apiSend("/api/settings", "PUT", { navLinks: JSON.stringify(navLinks) }, "Failed to save navigation.");
    setSaving(false);
    if (!res.ok) return showToast(res.error, "error");
    setDirty(false);
    showToast("Navigation saved.");
    router.refresh();
  };

  // Pages (and Home) that aren't in the menu yet, for one-click adding.
  const linked = new Set(navLinks.flatMap((l) => [l.href, l.pageId]));
  const homeLinked = linked.has("/");
  const suggestions = pages.filter((p) => !linked.has(p.pageId) && !linked.has(p.href));

  return (
    <>
      <AdminCard title="Site Navigation" className="nav-editor">
        <p className="settings-section-note">
          The links in your blog&apos;s header, in this order. Visitors reach /admin directly; there is no admin link on the public site.
        </p>
        <div className="nav-links-list">
          {navLinks.length === 0 && (
            <p className="settings-section-note settings-section-note--flush">No links yet. Add one below.</p>
          )}
          {navLinks.map((link, i) => (
            <div className="nav-link-row" key={i}>
              <span className="nav-link-row__label">
                {link.label}
                {link.pageId && <span className="badge badge--gray nav-link-row__badge">Page</span>}
              </span>
              <span className="nav-link-row__href">{link.href}</span>
              <div className="nav-link-row__actions">
                <button type="button" className="btn btn--ghost btn--sm" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" className="btn btn--ghost btn--sm" title="Move down" onClick={() => move(i, 1)} disabled={i === navLinks.length - 1}>↓</button>
                <button type="button" className="btn btn--ghost btn--sm" title="Remove" onClick={() => update(navLinks.filter((_, idx) => idx !== i))}>✕</button>
              </div>
            </div>
          ))}
        </div>
        {(suggestions.length > 0 || !homeLinked) && (
          <div className="nav-editor__suggest">
            <span>Add a page:</span>
            {!homeLinked && (
              <button type="button" className="filter-btn" onClick={() => addLink("Home", "/")}>
                + Home
              </button>
            )}
            {suggestions.map((p) => (
              <button key={p.pageId} type="button" className="filter-btn" onClick={() => addPage(p)}>
                + {p.label}
              </button>
            ))}
          </div>
        )}
        <div className="nav-link-add-row">
          <input
            type="text"
            placeholder="Label (e.g. Instagram)"
            aria-label="Link label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTyped(); } }}
          />
          <input
            type="text"
            placeholder="Other link (e.g. /category/news or https://…)"
            aria-label="Link address"
            value={newHref}
            onChange={(e) => setNewHref(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTyped(); } }}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={addTyped}>Add</button>
        </div>
        <div className="admin-save-bar">
          <button type="button" className="btn btn--primary btn--sm" disabled={saving || !dirty} onClick={save}>
            {saving ? "Saving…" : "Save Navigation"}
          </button>
          {dirty && <span className="field-hint">Unsaved changes</span>}
        </div>
      </AdminCard>
      {toastElement}
    </>
  );
}
