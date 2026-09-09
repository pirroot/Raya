"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Heart, Users, Shield, Zap, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-black text-foreground">درباره‌ما</h1>
        <Link
          href="/panel"
          className="btn btn-secondary rounded-[var(--radius)] p-2.5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <Card className="p-6 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-3xl font-black bg-linaer-to-l from-primary to-primary-hover bg-clip-text text-transparent">
            رایا
          </span>
          <Sparkles className="h-6 w-6 text-primary/60" />
        </div>

        {/* Description */}
        <p className="text-sm text-foreground-muted leading-relaxed">
          رایا یک اپلیکیشن جامع برای دانشجویان است که با هدف تسهیل
          <br />
          یادگیری، ارتباط و خرید و فروش در محیط دانشگاهی طراحی شده است.
        </p>

        {/* Features */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-background-subtle p-3">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">ارتباطات</p>
            <p className="text-[10px] text-foreground-muted">دانشجویی</p>
          </div>
          <div className="rounded-xl bg-background-subtle p-3">
            <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">امنیت</p>
            <p className="text-[10px] text-foreground-muted">بالا</p>
          </div>
          <div className="rounded-xl bg-background-subtle p-3">
            <Zap className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">سرعت</p>
            <p className="text-[10px] text-foreground-muted">بالا</p>
          </div>
          <div className="rounded-xl bg-background-subtle p-3">
            <Heart className="h-5 w-5 text-rose-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">ساخته شده با</p>
            <p className="text-[10px] text-foreground-muted">عشق</p>
          </div>
        </div>

        {/* Version */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-foreground-muted">نسخه ۱.۰.۰</p>
          <p className="text-[10px] text-foreground-muted/60 mt-1">
            © {new Date().getFullYear()} تمامی حقوق محفوظ است
          </p>
        </div>
      </Card>
    </Container>
  );
}