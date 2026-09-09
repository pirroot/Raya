"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

type AuthBackButtonProps = {
  href: string;
  label?: string;
};

export default function AuthBackButton({
  href,
  label = "بازگشت",
}: AuthBackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.replace(href)}
      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white active:scale-[0.98]"
    >
      <ArrowRight className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
