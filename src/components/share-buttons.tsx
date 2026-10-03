"use client";

import { useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

const ICONS = {
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="15" height="15" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="15" height="15" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
};

export function ShareButtons({ title, label = "Share" }: { title: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  // false during SSR/hydration, then the real value — avoids a hydration mismatch.
  const canNativeShare = useSyncExternalStore(noopSubscribe, () => "share" in navigator, () => false);

  // Read the URL at click time so it is correct wherever the site is hosted.
  const open = (build: (url: string, text: string) => string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    window.open(build(url, text), "_blank", "noopener,noreferrer,width=600,height=540");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const share = async () => {
    try {
      await navigator.share({ title, url: window.location.href });
    } catch {}
  };

  return (
    <div className="share">
      <span className="share__label">{label}</span>
      <button type="button" className="share__btn" title="Share on X" onClick={() => open((u, t) => `https://x.com/intent/post?url=${u}&text=${t}`)}>
        {ICONS.x}
      </button>
      <button type="button" className="share__btn" title="Share on LinkedIn" onClick={() => open((u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`)}>
        {ICONS.linkedin}
      </button>
      <button type="button" className="share__btn" title="Share on Facebook" onClick={() => open((u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`)}>
        {ICONS.facebook}
      </button>
      <button
        type="button"
        className="share__btn"
        title="Share by email"
        onClick={() => {
          window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(window.location.href)}`;
        }}
      >
        {ICONS.email}
      </button>
      <button type="button" className={`share__btn share__btn--wide${copied ? " is-copied" : ""}`} onClick={copy}>
        {ICONS.link}
        {copied ? "Copied!" : "Copy link"}
      </button>
      {canNativeShare && (
        <button type="button" className="share__btn share__btn--native" title="More options" onClick={share}>
          •••
        </button>
      )}
    </div>
  );
}
