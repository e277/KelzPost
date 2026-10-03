"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { ImageUpload } from "./image-upload";

/** The signed-in team member's public author profile. */
export function ProfileForm({
  username,
  role,
  displayName: initialName,
  bio: initialBio,
  avatar: initialAvatar,
  slug: initialSlug,
  siteAuthorName,
}: {
  username: string;
  role: "admin" | "author";
  displayName: string;
  bio: string;
  avatar: string;
  slug: string | null;
  siteAuthorName: string;
}) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [displayName, setDisplayName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [slug, setSlug] = useState(initialSlug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, avatar }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      setError(data.error || "Could not save your profile.");
      return;
    }
    const saved = await res.json();
    setSlug(saved.slug);
    showToast("Profile saved.");
    router.refresh();
  };

  return (
    <form className="editor-card" onSubmit={save}>
      <div className="editor-card__header">Author profile</div>
      <div className="editor-card__body">
        <p className="profile-meta">
          Signed in as <strong>{username}</strong> · {role === "admin" ? "Admin" : "Author"}
          {slug && displayName.trim() && (
            <>
              {" · "}
              <Link href={`/author/${slug}`} target="_blank">
                View your author page ↗
              </Link>
            </>
          )}
        </p>
        <div className="form-group">
          <label htmlFor="profileName">Name shown on your posts</label>
          <input
            id="profileName"
            value={displayName}
            maxLength={60}
            required={role !== "admin"}
            placeholder={role === "admin" ? siteAuthorName : "Your name"}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          {role === "admin" && (
            <small className="field-hint">
              Leave empty to write as the blog&apos;s author from Pages → About ({siteAuthorName}), with that bio and photo.
            </small>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="profileBio">Short bio</label>
          <textarea id="profileBio" rows={4} maxLength={600} value={bio} placeholder="A sentence or two shown under your posts and on your author page." onChange={(e) => setBio(e.target.value)} />
          <small className="field-hint">{bio.length}/600</small>
        </div>
        <div className="form-group">
          <label>Photo</label>
          <ImageUpload value={avatar} onChange={setAvatar} round onError={(m) => showToast(m, "error")} />
        </div>
        <p className={`form-error${error ? " visible" : ""}`}>{error}</p>
        <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
      {toastElement}
    </form>
  );
}
