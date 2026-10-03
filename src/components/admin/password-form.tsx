"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";
import { apiSend } from "@/lib/admin-api";
import { AdminCard, Field, FormError } from "./ui";

/** "Change password" card for the signed-in team member (Your Profile). */
export function PasswordForm() {
  const { showToast, toastElement } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setSaving(true);
    const res = await apiSend("/api/auth/password", "POST", { currentPassword, newPassword }, "Failed to update password.");
    setSaving(false);
    if (!res.ok) return setPasswordError(res.error);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Password updated.");
  };

  return (
    <>
      <AdminCard title="Password" id="security" onSubmit={changePassword}>
        <Field label="Current Password" htmlFor="currentPassword">
          <input type="password" id="currentPassword" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </Field>
        <Field label="New Password" htmlFor="newPassword">
          <input type="password" id="newPassword" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </Field>
        <Field label="Confirm New Password" htmlFor="confirmPassword">
          <input type="password" id="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </Field>
        <FormError message={passwordError} />
        <button type="submit" className="btn btn--ghost btn--sm" disabled={saving}>
          {saving ? "Saving…" : "Change Password"}
        </button>
      </AdminCard>
      {toastElement}
    </>
  );
}
