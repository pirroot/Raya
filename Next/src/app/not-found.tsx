// src/app/not-found.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Home, Search, AlertCircle } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="flex items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft">
          <AlertCircle className="h-12 w-12 text-primary" strokeWidth={1.5} />
        </div>

        {/* 404 */}
        <h1 className="text-7xl font-black text-foreground">۴۰۴</h1>
        <h2 className="mt-2 text-xl font-black text-foreground">صفحه پیدا نشد!</h2>

        <p className="mt-3 text-sm text-foreground-muted">
          صفحه‌ای که دنبالش هستید وجود ندارد یا منتقل شده است.
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/"
            className="btn btn-primary w-full"
          >
            <Home className="h-4 w-4" />
            صفحه اصلی
          </Link>

          <button
            onClick={() => router.back()}
            className="btn btn-secondary w-full"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت
          </button>

          <Link
            href="/panel"
            className="btn btn-ghost w-full text-sm"
          >
            <Search className="h-4 w-4" />
            پنل کاربری
          </Link>
        </div>

        <p className="mt-6 text-xs text-foreground-muted">
          اگر فکر می‌کنید خطاست، با پشتیبانی تماس بگیرید.
        </p>
      </div>
    </main>
  );
}