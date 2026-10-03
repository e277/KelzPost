"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { apiSend } from "@/lib/admin-api";
import { ImageUpload } from "./image-upload";
import { AdminCard, Field, FormError } from "./ui";

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
    const res = await apiSend<{ slug: string | null }>("/api/profile", "PUT", { displayName, bio, avatar }, "Could not save your profile.");
    setSaving(false);
    if (!res.ok) return setError(res.error);
    setSlug(res.data.slug);
    showToast("Profile saved.");
    router.refresh();
  };

  return (
    <>
      <AdminCard title="Author profile" onSubmit={save}>
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
        <Field
          label="Name shown on your posts"
          htmlFor="profileName"
          hint={
            role === "admin"
              ? <>Leave empty to write as the blog&apos;s author from Pages → About ({siteAuthorName}), with that bio and photo.</>
              : undefined
          }
        >
          <input
            id="profileName"
            value={displayName}
            maxLength={60}
            required={role !== "admin"}
            placeholder={role === "admin" ? siteAuthorName : "Your name"}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Field>
        <Field label="Short bio" htmlFor="profileBio" hint={`${bio.length}/600`}>
          <textarea id="profileBio" rows={4} maxLength={600} value={bio} placeholder="A sentence or two shown under your posts and on your author page." onChange={(e) => setBio(e.target.value)} />
        </Field>
        <Field label="Photo">
          <ImageUpload value={avatar} onChange={setAvatar} round onError={(m) => showToast(m, "error")} />
        </Field>
        <FormError message={error} />
        <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </AdminCard>
      {toastElement}
    </>
  );
}
