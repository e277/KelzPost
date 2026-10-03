"use client";

import { useState, type FormEvent } from "react";
import type { SiteText } from "@/lib/site-text";

/** Email signup card for the public site. */
export function NewsletterSignup({ text }: { text: Pick<SiteText, "newsletterHeading" | "newsletterText" | "newsletterButton"> }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const data = await res.json().catch(() => ({}));
      setResult({ ok: res.ok, message: data.message || data.error || "Something went wrong. Please try again." });
      if (res.ok) setEmail("");
    } catch {
      setResult({ ok: false, message: "Something went wrong. Please try again." });
    }
    setBusy(false);
  };

  return (
    <section className="newsletter" aria-labelledby="newsletter-title">
      <h2 id="newsletter-title" className="newsletter__title">
        {text.newsletterHeading}
      </h2>
      <p className="newsletter__text">{text.newsletterText}</p>

      {result?.ok ? (
        <p className="newsletter__result" role="status">
          {result.message}
        </p>
      ) : (
        <form className="newsletter__form" onSubmit={handleSubmit}>
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {/* Honeypot: hidden from people, filled in by bots. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="newsletter__trap"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Subscribing…" : text.newsletterButton}
          </button>
        </form>
      )}
      {result && !result.ok && (
        <p className="newsletter__result newsletter__result--error" role="alert">
          {result.message}
        </p>
      )}
    </section>
  );
}
