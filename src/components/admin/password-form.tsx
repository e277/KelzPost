"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";

/** "Change password" card for the signed-in team member. */
export function PasswordForm() {
  const { showToast, toastElement } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const changePassword = async () => {
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
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated.");
    } else {
      const data = await res.json().catch(() => ({}));
      setPasswordError(data.error || "Failed to update password.");
    }
  };

  return (
    <div className="editor-card" id="security">
      <div className="editor-card__header">Password</div>
      <div className="editor-card__body">
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input type="password" id="currentPassword" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input type="password" id="newPassword" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input type="password" id="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <p className={`form-error${passwordError ? " visible" : ""}`} style={{ marginTop: 14 }}>
          {passwordError}
        </p>
        <button className="btn btn--ghost btn--sm" style={{ marginTop: 10 }} onClick={changePassword}>
          Change Password
        </button>
      </div>
      {toastElement}
    </div>
  );
}
