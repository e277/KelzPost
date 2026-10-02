"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Only allow redirecting back into the admin area (prevents open redirects). */
function safeNext(next: string | undefined) {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setPassword("");
        setLoading(false);
        return;
      }

      router.replace(safeNext(next));
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="loginUser">Username</label>
        <input
          type="text"
          id="loginUser"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="loginPass">Password</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            id="loginPass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="password-field__toggle"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Keep me signed in for 7 days
      </label>
      <p className={`form-error${error ? " visible" : ""}`} role="alert">
        {error}
      </p>
      <button
        type="submit"
        className="btn btn--primary btn--full"
        style={{ marginTop: 8 }}
        disabled={loading || !username.trim() || !password}
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
