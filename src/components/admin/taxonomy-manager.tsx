"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { apiSend } from "@/lib/admin-api";
import { AdminCard, ConfirmDialog } from "./ui";

/** A category or tag with how many posts use it. */
export type TermSummary = { id: string; name: string; posts: number };

type Kind = "category" | "tag";
const API = { category: "/api/categories", tag: "/api/tags" } as const;

/** Categories and tags: how posts are grouped on the blog. Both can be added, renamed and deleted here. */
export function TaxonomyManager({ categories, tags }: { categories: TermSummary[]; tags: TermSummary[] }) {
  return (
    <div className="taxonomy-grid">
      <AdminCard title="Categories">
        <p className="settings-section-note">
          Categories appear as filters along the top of the Blog page, in this order, and in the post editor. A post can be in several.
        </p>
        <TermList kind="category" initial={categories} />
      </AdminCard>

      <AdminCard title="Tags">
        <p className="settings-section-note">
          Each tag gets its own page on the blog. Tags can also be added from the post editor.
        </p>
        <TermList kind="tag" initial={tags} />
      </AdminCard>
    </div>
  );
}

function TermList({ kind, initial }: { kind: Kind; initial: TermSummary[] }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [items, setItems] = useState(initial);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TermSummary | null>(null);
  const label = kind === "category" ? "category" : "tag";
  const ordered = kind === "category";

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    const res = await apiSend<TermSummary>(API[kind], "POST", { name }, `Failed to add the ${label}.`);
    setBusy(false);
    if (!res.ok) return showToast(res.error, "error");
    setItems((list) => {
      const next = [...list, { id: res.data.id, name: res.data.name, posts: 0 }];
      return ordered ? next : next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setNewName("");
    router.refresh();
  };

  const rename = async (item: TermSummary) => {
    const name = editName.trim();
    if (!name || name === item.name) return setEditId(null);
    setBusy(true);
    const res = await apiSend<{ name: string }>(`${API[kind]}/${item.id}`, "PUT", { name }, `Failed to rename the ${label}.`);
    setBusy(false);
    if (!res.ok) return showToast(res.error, "error");
    setItems((list) => list.map((x) => (x.id === item.id ? { ...x, name: res.data.name } : x)));
    setEditId(null);
    showToast(`Renamed to “${res.data.name}”.`);
    router.refresh();
  };

  // Swaps two neighbouring categories and saves every position, so the order is always 0, 1, 2…
  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    setBusy(true);
    const results = await Promise.all(next.map((item, i) => apiSend(`${API[kind]}/${item.id}`, "PUT", { order: i }, "Failed to save the order.")));
    setBusy(false);
    const failed = results.find((r) => !r.ok);
    if (failed && !failed.ok) {
      setItems(items);
      return showToast(failed.error, "error");
    }
    router.refresh();
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    const res = await apiSend(`${API[kind]}/${pendingDelete.id}`, "DELETE", undefined, `Failed to delete the ${label}.`);
    setBusy(false);
    if (!res.ok) return showToast(res.error, "error");
    setItems((list) => list.filter((x) => x.id !== pendingDelete.id));
    setPendingDelete(null);
    router.refresh();
  };

  return (
    <>
      <ul className="term-list">
        {items.length === 0 && <li className="term-list__empty">No {label === "category" ? "categories" : "tags"} yet. Add one below.</li>}
        {items.map((item, i) => (
          <li className="term-row" key={item.id}>
            {editId === item.id ? (
              <form
                className="term-row__edit"
                onSubmit={(e) => {
                  e.preventDefault();
                  rename(item);
                }}
              >
                <input
                  type="text"
                  aria-label={`New name for ${item.name}`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setEditId(null)}
                  autoFocus
                />
                <button type="submit" className="btn btn--primary btn--sm" disabled={busy || !editName.trim()}>
                  Save
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <span className="term-row__name">{item.name}</span>
                <span className="term-row__count">
                  {item.posts} {item.posts === 1 ? "post" : "posts"}
                </span>
                <span className="term-row__actions">
                  {ordered && (
                    <>
                      <button type="button" className="btn btn--ghost btn--sm" title="Move up" aria-label={`Move ${item.name} up`} disabled={busy || i === 0} onClick={() => move(i, -1)}>
                        ↑
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" title="Move down" aria-label={`Move ${item.name} down`} disabled={busy || i === items.length - 1} onClick={() => move(i, 1)}>
                        ↓
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setEditId(item.id);
                      setEditName(item.name);
                    }}
                  >
                    Rename
                  </button>
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => setPendingDelete(item)}>
                    Delete
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>

      <form
        className="tag-add-row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input type="text" placeholder={`Add a ${label}…`} aria-label={`New ${label}`} value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button type="submit" className="btn btn--ghost btn--sm" disabled={busy || !newName.trim()}>
          Add
        </button>
      </form>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete ${label === "category" ? "Category" : "Tag"}?`}
        busy={busy}
        busyLabel="Deleting…"
        onConfirm={remove}
        onCancel={() => setPendingDelete(null)}
      >
        {pendingDelete && (
          <>
            “{pendingDelete.name}” will be removed
            {pendingDelete.posts > 0 ? ` from ${pendingDelete.posts} ${pendingDelete.posts === 1 ? "post" : "posts"}` : ""}. The posts themselves stay.
          </>
        )}
      </ConfirmDialog>
      {toastElement}
    </>
  );
}
