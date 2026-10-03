"use client";

import Link from "next/link";
import { useState } from "react";

export function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  if (state === "done") {
    return (
      <>
        <p className="notice-page__result">You&apos;re unsubscribed and won&apos;t get any more emails.</p>
        <Link href="/" className="btn btn--navy">
          ← Back to Blog
        </Link>
      </>
    );
  }

  const handleClick = async () => {
    setState("busy");
    const res = await fetch("/api/newsletter/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => null);
    setState(res?.ok ? "done" : "error");
  };

  return (
    <>
      {state === "error" && <p className="notice-page__result notice-page__result--error">This unsubscribe link isn&apos;t valid.</p>}
      <button type="button" className="btn btn--navy" disabled={!token || state === "busy"} onClick={handleClick}>
        {state === "busy" ? "Unsubscribing…" : "Unsubscribe"}
      </button>
    </>
  );
}
