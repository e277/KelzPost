"use client";

import { useState } from "react";

type RevisionSummary = { id: string; title: string; savedBy: string; createdAt: string; words: number };
export type Revision = { id: string; title: string; excerpt: string; content: string; createdAt: string };

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Editor sidebar card listing a post's saved versions. Restoring loads a
 * version into the editor; nothing changes until the post is saved again.
 */
export function RevisionHistory({
  postId,
  onRestore,
  onError,
}: {
  postId: string;
  onRestore: (revision: Revision) => void;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [revisions, setRevisions] = useState<RevisionSummary[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/posts/${postId}/revisions`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) {
      onError("Could not load the version history.");
      return;
    }
    setRevisions(await res.json());
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void load();
  };

  const restore = async (id: string) => {
    setBusyId(id);
    const res = await fetch(`/api/posts/${postId}/revisions/${id}`).catch(() => null);
    setBusyId(null);
    if (!res?.ok) {
      onError("Could not load that version.");
      return;
    }
    onRestore(await res.json());
  };

  return (
    <div className="editor-card">
      <button type="button" className="editor-card__header editor-card__toggle" aria-expanded={open} onClick={toggle}>
        Version History
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="editor-card__body">
          {revisions === null ? (
            <p className="field-hint">Loading…</p>
          ) : revisions.length === 0 ? (
            <p className="field-hint">Versions appear here each time the post is saved.</p>
          ) : (
            <>
              <ol className="revision-list">
                {revisions.map((r, i) => (
                  <li key={r.id}>
                    <div>
                      <strong>{when(r.createdAt)}</strong>
                      <span>
                        {i === 0 ? "Latest save" : r.savedBy ? "Saved" : "Earlier version"}
                        {r.savedBy ? ` by ${r.savedBy}` : ""} · {r.words.toLocaleString()} words
                      </span>
                    </div>
                    <button type="button" className="btn btn--ghost btn--sm" disabled={busyId === r.id} onClick={() => restore(r.id)}>
                      {busyId === r.id ? "…" : "Restore"}
                    </button>
                  </li>
                ))}
              </ol>
              <button type="button" className="link-btn revision-list__refresh" onClick={load}>
                Refresh
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
