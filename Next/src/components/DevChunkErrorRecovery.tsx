"use client";

import { useEffect } from "react";

// ===== Constants =====
const SESSION_STORAGE_KEY = "__dev_chunk_recovery_once__";
const CHUNK_ERROR_PATTERN = /ChunkLoadError|Loading chunk [^\s]+ failed/i;

// ===== Helpers =====
function isChunkError(reason: unknown): boolean {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : "";

  return CHUNK_ERROR_PATTERN.test(message);
}

function hasReloadedBefore(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SESSION_STORAGE_KEY) === "1";
}

function markAsReloaded(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
}

function reloadPage(): void {
  if (typeof window === "undefined") return;
  window.location.reload();
}

// ===== Component =====
export default function DevChunkErrorRecovery() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const handleError = (event: ErrorEvent) => {
      if (isChunkError(event.error || event.message) && !hasReloadedBefore()) {
        markAsReloaded();
        reloadPage();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isChunkError(event.reason) && !hasReloadedBefore()) {
        markAsReloaded();
        reloadPage();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}