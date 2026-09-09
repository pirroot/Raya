"use client";

import { useEffect } from "react";

// ===== Constants =====
const SW_URL = "/sw.js";
const SW_SCOPE = "/";
const SKIP_WAITING_MESSAGE = { type: "SKIP_WAITING" };

// ===== Helpers =====
function isServiceWorkerSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

function shouldRegister(): boolean {
  return process.env.NODE_ENV === "production";
}

function reloadPage(): void {
  window.location.reload();
}

function promptForUpdate(): boolean {
  return confirm(
    "نسخه جدید در دسترس است. صفحه را برای دریافت به‌روزرسانی بارگذاری مجدد می‌کنید؟"
  );
}

function skipWaiting(worker: ServiceWorker): void {
  try {
    worker.postMessage({ type: "SKIP_WAITING" });
  } catch {
    // Ignore
  }

  try {
    const workerWithSkip = worker as any;
    if (typeof workerWithSkip.skipWaiting === "function") {
      workerWithSkip.skipWaiting();
    }
  } catch {
    // Ignore
  }
}

function handleControllerChange(onReload: () => void): () => void {
  let refreshing = false;

  const handler = () => {
    if (refreshing) return;
    refreshing = true;
    onReload();
  };

  navigator.serviceWorker.addEventListener("controllerchange", handler);

  return () => {
    navigator.serviceWorker.removeEventListener("controllerchange", handler);
  };
}

// ===== Component =====
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!isServiceWorkerSupported()) return;
    if (!shouldRegister()) return;

    let cleanupController: (() => void) | null = null;

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      if (!promptForUpdate()) return;

      if (registration.waiting) {
        skipWaiting(registration.waiting);
      }

      // Clean up previous controller change listener
      if (cleanupController) {
        cleanupController();
        cleanupController = null;
      }

      cleanupController = handleControllerChange(reloadPage);
    };

    navigator.serviceWorker
      .register(SW_URL, { scope: SW_SCOPE })
      .then((registration) => {
        if (registration.waiting) {
          handleUpdate(registration);
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              handleUpdate(registration);
            }
          });
        });
      })
      .catch(() => {
        // Silent fail
      });

    return () => {
      if (cleanupController) {
        cleanupController();
        cleanupController = null;
      }
    };
  }, []);

  return null;
}