"use client";

import { useState } from "react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleClick} className="btn btn--ghost btn--sm">
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
