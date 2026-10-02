"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      setError("Incorrect username or password. Please try again.");
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="loginUser">Username</label>
        <input
          type="text"
          id="loginUser"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
        />
      </div>
      <div className="form-group">
        <label htmlFor="loginPass">Password</label>
        <input
          type="password"
          id="loginPass"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoComplete="current-password"
        />
      </div>
      <p className={`form-error${error ? " visible" : ""}`}>{error}</p>
      <button type="submit" className="btn btn--primary btn--full" style={{ marginTop: 8 }}>
        Sign In
      </button>
    </form>
  );
}
