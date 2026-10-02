"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SetupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password !== confirm) return setError("Passwords don't match.");
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).catch(() => null);

    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error || "Setup failed. Please try again.");
      setLoading(false);
      if (res?.status === 409) router.refresh();
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="setupUser">Username</label>
        <input
          id="setupUser"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
        />
      </div>
      <div className="form-group">
        <label htmlFor="setupPass">Password</label>
        <input id="setupPass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <small className="field-hint">At least 8 characters.</small>
      </div>
      <div className="form-group">
        <label htmlFor="setupConfirm">Confirm password</label>
        <input id="setupConfirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </div>
      <p className={`form-error${error ? " visible" : ""}`} role="alert">
        {error}
      </p>
      <button type="submit" className="btn btn--primary btn--full" disabled={loading || !username || password.length < 8 || !confirm}>
        {loading ? "Creating account…" : "Create admin account"}
      </button>
    </form>
  );
}
