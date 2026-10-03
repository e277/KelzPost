"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { formatDate } from "@/lib/utils";

export type TeamRow = {
  id: string;
  username: string;
  name: string;
  hasDisplayName: boolean;
  role: "admin" | "author";
  slug: string | null;
  posts: number;
  joined: Date;
  isYou: boolean;
};

const ROLE_HELP = {
  admin: "Can do everything: settings, pages, comments, newsletter and the team.",
  author: "Can write, publish and edit their own posts only.",
};

export function TeamManager({ team }: { team: TeamRow[] }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "author">("author");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [removing, setRemoving] = useState<TeamRow | null>(null);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setBusy("add");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, username, password, role }),
    }).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      setFormError(data.error || "Could not add that person.");
      return;
    }
    showToast(`${displayName.trim()} can now sign in as “${username.trim()}”.`);
    setDisplayName("");
    setUsername("");
    setPassword("");
    setRole("author");
    router.refresh();
  };

  const update = async (member: TeamRow, body: Record<string, string>, done: string) => {
    setBusy(member.id);
    const res = await fetch(`/api/users/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      showToast(data.error || "Could not save that change.", "error");
      return;
    }
    showToast(done);
    router.refresh();
  };

  const resetPassword = (member: TeamRow) => {
    const next = window.prompt(`New password for ${member.name} (at least 8 characters). Share it with them; they can change it under Your Profile.`);
    if (next === null) return;
    void update(member, { password: next }, `Password changed for ${member.name}.`);
  };

  const remove = async () => {
    if (!removing) return;
    const member = removing;
    setRemoving(null);
    setBusy(member.id);
    const res = await fetch(`/api/users/${member.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      showToast(data.error || "Could not remove that person.", "error");
      return;
    }
    showToast(`${member.name} was removed.`);
    router.refresh();
  };

  return (
    <>
      <div className="posts-table-wrap" style={{ marginBottom: 28 }}>
        <div className="posts-table-header">
          <h2>Team members</h2>
        </div>
        <div className="posts-table-scroll">
          <table className="posts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Posts</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="posts-table__title">
                      {m.slug && m.hasDisplayName ? (
                        <Link href={`/author/${m.slug}`} target="_blank">
                          {m.name}
                        </Link>
                      ) : (
                        <span>{m.name}</span>
                      )}
                      {m.isYou && <span className="badge badge--gray team-you">You</span>}
                      <p>Signs in as {m.username}</p>
                    </div>
                  </td>
                  <td>
                    <select
                      className="dash-control"
                      value={m.role}
                      disabled={m.isYou || busy === m.id}
                      title={m.isYou ? "Another admin can change your role" : ROLE_HELP[m.role]}
                      aria-label={`Role for ${m.name}`}
                      onChange={(e) => update(m, { role: e.target.value }, `${m.name} is now ${e.target.value === "admin" ? "an admin" : "an author"}.`)}
                    >
                      <option value="admin">Admin</option>
                      <option value="author">Author</option>
                    </select>
                  </td>
                  <td>{m.posts}</td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--gray-400)" }}>{formatDate(m.joined)}</td>
                  <td>
                    {m.isYou ? (
                      <Link href="/admin/profile" className="btn btn--ghost btn--sm">
                        Edit profile
                      </Link>
                    ) : (
                      <div className="posts-table__actions">
                        <button type="button" className="btn btn--ghost btn--sm" disabled={busy === m.id} onClick={() => resetPassword(m)}>
                          Set password
                        </button>
                        <button type="button" className="btn btn--danger btn--sm" disabled={busy === m.id} onClick={() => setRemoving(m)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form className="editor-card team-add" onSubmit={addMember}>
        <div className="editor-card__header">Add a team member</div>
        <div className="editor-card__body">
          <div className="team-add__grid">
            <div className="form-group">
              <label htmlFor="memberName">Name shown on their posts</label>
              <input id="memberName" value={displayName} maxLength={60} required onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Jordan Lee" />
            </div>
            <div className="form-group">
              <label htmlFor="memberUsername">Username</label>
              <input id="memberUsername" value={username} required autoComplete="off" onChange={(e) => setUsername(e.target.value)} placeholder="e.g. jordan" />
            </div>
            <div className="form-group">
              <label htmlFor="memberPassword">Temporary password</label>
              <input id="memberPassword" type="text" value={password} required minLength={8} autoComplete="off" onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div className="form-group">
              <label htmlFor="memberRole">Role</label>
              <select id="memberRole" value={role} onChange={(e) => setRole(e.target.value === "admin" ? "admin" : "author")}>
                <option value="author">Author</option>
                <option value="admin">Admin</option>
              </select>
              <small className="field-hint">{ROLE_HELP[role]}</small>
            </div>
          </div>
          <p className={`form-error${formError ? " visible" : ""}`}>{formError}</p>
          <button type="submit" className="btn btn--primary btn--sm" disabled={busy === "add"}>
            {busy === "add" ? "Adding…" : "Add to team"}
          </button>
          <small className="field-hint">Send them the username and password yourself. They sign in at /admin and can change the password under Your Profile.</small>
        </div>
      </form>

      <div className={`modal-overlay${removing ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setRemoving(null); }}>
        <div className="modal" role="dialog" aria-modal="true">
          <h2 className="modal__title">Remove {removing?.name}?</h2>
          <p className="modal__body">
            They won&apos;t be able to sign in any more. Their posts stay on the blog under their name.
          </p>
          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={() => setRemoving(null)}>
              Cancel
            </button>
            <button className="btn btn--danger" onClick={remove}>
              Remove
            </button>
          </div>
        </div>
      </div>

      {toastElement}
    </>
  );
}
