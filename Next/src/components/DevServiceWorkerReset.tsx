"use client";

import { useEffect } from "react";

// ===== Constants =====
const SESSION_STORAGE_KEY = "__dev_sw_reset_reload_once__";

// ===== Helpers =====
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

async function clearServiceWorkers(): Promise<{
  hasUnregisteredAny: boolean;
  hasDeletedAnyCache: boolean;
}> {
  if (!("serviceWorker" in navigator)) {
    return { hasUnregisteredAny: false, hasDeletedAnyCache: false };
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const unregisterResults = await Promise.all(
    registrations.map((reg) => reg.unregister())
  );
  const hasUnregisteredAny = unregisterResults.some(Boolean);

  let hasDeletedAnyCache = false;
  if ("caches" in window) {
    const keys = await caches.keys();
    const deleteResults = await Promise.all(keys.map((key) => caches.delete(key)));
    hasDeletedAnyCache = deleteResults.some(Boolean);
  }

  return { hasUnregisteredAny, hasDeletedAnyCache };
}

// ===== Component =====
export default function DevServiceWorkerReset() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (hasReloadedBefore()) return;

    clearServiceWorkers()
      .then((result) => {
        if (result.hasUnregisteredAny || result.hasDeletedAnyCache) {
          markAsReloaded();
          reloadPage();
        }
      })
      .catch(() => {
        // Silent fail in development
      });
  }, []);

  return null;
}