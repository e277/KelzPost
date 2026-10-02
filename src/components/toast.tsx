"use client";

import { useCallback, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const toastElement = toast ? (
    <div className={`toast toast--visible toast--${toast.type}`}>{toast.message}</div>
  ) : null;

  return { showToast, toastElement };
}
