"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { apiSend } from "@/lib/admin-api";

export type PageListRow = {
  id: string;
  title: string;
  builtIn?: boolean;
  meta: string;
  viewHref: string;
  editHref: string;
  editLabel?: string;
};

// Every page, built-in and custom, and the header menu in one place: tick "In menu"
// to show a page in the site's header and use the arrows to order it. Pages in the
// menu are listed first, in menu order.
export function PageList({ rows, menu: initialMenu }: { rows: PageListRow[]; menu: string[] }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [menu, setMenu] = useState(initialMenu);
  const [saving, setSaving] = useState(false);

  const save = async (next: string[]) => {
    const previous = menu;
    setMenu(next);
    setSaving(true);
    const res = await apiSend<{ pageIds: string[] }>("/api/navigation", "PUT", { pageIds: next }, "Failed to update the menu.");
    setSaving(false);
    if (!res.ok) {
      setMenu(previous);
      return showToast(res.error, "error");
    }
    setMenu(res.data.pageIds);
    router.refresh();
  };

  const toggle = (id: string, show: boolean) => save(show ? [...menu, id] : menu.filter((x) => x !== id));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= menu.length) return;
    const next = [...menu];
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };

  const inMenu = menu.map((id) => rows.find((r) => r.id === id)).filter((r): r is PageListRow => Boolean(r));
  const others = rows.filter((r) => !menu.includes(r.id));

  return (
    <>
      <div className="dash-posts">
        {[...inMenu, ...others].map((row) => {
          const position = menu.indexOf(row.id);
          return (
            <div className="dash-post-row" key={row.id}>
              <div className="dash-post-row__info">
                <Link href={row.editHref} className="dash-post-row__title">
                  {row.title}
                  {row.builtIn && <span className="badge badge--gray">Built-in</span>}
                </Link>
                <span className="dash-post-row__meta">{row.meta}</span>
              </div>
              <div className="dash-post-row__actions">
                <label className="checkbox-row page-menu-toggle">
                  <input
                    type="checkbox"
                    checked={position !== -1}
                    disabled={saving}
                    onChange={(e) => toggle(row.id, e.target.checked)}
                  />
                  In menu
                </label>
                {position !== -1 && (
                  <span className="page-menu-order">
                    <button type="button" className="btn btn--ghost btn--sm" title="Move up in the menu" aria-label={`Move ${row.title} earlier in the menu`} disabled={saving || position === 0} onClick={() => move(position, -1)}>
                      ↑
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" title="Move down in the menu" aria-label={`Move ${row.title} later in the menu`} disabled={saving || position === menu.length - 1} onClick={() => move(position, 1)}>
                      ↓
                    </button>
                  </span>
                )}
                <a href={row.viewHref} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
                  View
                </a>
                <Link href={row.editHref} className="btn btn--ghost btn--sm">
                  {row.editLabel || "Edit"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      {toastElement}
    </>
  );
}
