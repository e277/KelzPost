"use client";

import { useEffect } from "react";

const STORAGE_KEY = "post-views";

/** Records one read of the post per browser per day (see /api/views). */
export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    let seen: Record<string, string> = {};
    try {
      seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {}
    if (seen[postId] === today) return;

    // Wait a moment so quick bounces and prefetches don't count.
    const timer = setTimeout(() => {
      fetch("/api/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
        keepalive: true,
      }).catch(() => null);
      try {
        // Keep only today's entries so the record stays small.
        const fresh = Object.fromEntries(Object.entries(seen).filter(([, day]) => day === today));
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...fresh, [postId]: today }));
      } catch {}
    }, 3000);
    return () => clearTimeout(timer);
  }, [postId]);

  return null;
}
