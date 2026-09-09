"use client";

import Link from "next/link";
import { Star, Clock, Brain, CheckCircle, ChevronRight } from "lucide-react";
import { Card } from "../ui/Card";

interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  coin_price: number;
  questions_count: number;
  duration: number;
  level: string;
  rating: number;
  reviews: number;
  is_purchased: boolean;
  is_completed: boolean;
}

interface TestCardProps {
  test: Test;
}

const levelMap: Record<string, { label: string; className: string }> = {
  simple: { label: "ساده", className: "bg-success/10 text-success" },
  medium: { label: "متوسط", className: "bg-warning/10 text-warning" },
  advanced: { label: "پیشرفته", className: "bg-error/10 text-error" },
};

const categoryMap: Record<string, string> = {
  personality: "شخصیت شناسی",
  iq: "هوش و استعداد",
  academic: "تحصیلی",
  psychology: "روانشناسی",
  emotional: "هوش هیجانی",
};

const currencyFormatter = new Intl.NumberFormat("fa-IR");

export function TestCard({ test }: TestCardProps) {
  const levelInfo = levelMap[test.level] || { label: test.level, className: "bg-background-subtle" };
  const categoryLabel = categoryMap[test.category] || test.category;

  return (
    <Card className="p-4 transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-lg)]">
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <span className="badge badge-primary text-[9px]">{categoryLabel}</span>
            <h3 className="mt-2 text-base font-black text-foreground">{test.title}</h3>
            <p className="mt-1 text-xs text-foreground-muted line-clamp-2">{test.description}</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-2xl">
            🧠
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-foreground-muted">
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {test.duration} دقیقه
          </span>
          <span className="flex items-center gap-0.5">
            <Brain className="h-3 w-3" />
            {test.questions_count} سوال
          </span>
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {test.rating} ({test.reviews})
          </span>
          <span className={`badge ${levelInfo.className} text-[8px]`}>
            {levelInfo.label}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div>
            {test.is_purchased ? (
              <span className="flex items-center gap-1 text-xs font-bold text-success">
                <CheckCircle className="h-4 w-4" />
                {test.is_completed ? "تکمیل شده" : "خریداری شده"}
              </span>
            ) : test.price === 0 && test.coin_price === 0 ? (
              <span className="text-xs font-bold text-success">رایگان</span>
            ) : (
              <span className="text-sm font-black text-primary">
                {currencyFormatter.format(test.price)} تومان
              </span>
            )}
          </div>
          <Link
            href={
              test.is_purchased
                ? `/psychology-test/${test.id}`
                : `/psychology-test/${test.id}/purchase`
            }
            className="btn btn-primary rounded-[var(--radius)] px-4 py-1.5 text-xs"
          >
            {test.is_purchased
              ? test.is_completed
                ? "مشاهده نتیجه"
                : "شروع تست"
              : test.price === 0 && test.coin_price === 0
              ? "شروع تست"
              : "خرید و شروع"}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
