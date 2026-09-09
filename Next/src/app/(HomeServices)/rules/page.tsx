"use client";

import Link from "next/link";
import { ArrowRight, Shield, Scale, BookOpen, Users, AlertCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

const rules = [
  {
    icon: Shield,
    title: "حریم خصوصی",
    items: [
      "اطلاعات شخصی کاربران نزد ما محفوظ است",
      "اطلاعات فقط برای ارائه خدمات استفاده می‌شود",
      "کاربران حق حذف اطلاعات خود را دارند",
    ],
  },
  {
    icon: Scale,
    title: "قوانین بازارچه",
    items: [
      "آگهی‌ها پس از تایید ادمین منتشر می‌شوند",
      "محتوای مغایر با قوانین حذف می‌شود",
      "قیمت‌ها به تومان است و قابل مذاکره",
    ],
  },
  {
    icon: BookOpen,
    title: "قوانین دوره‌ها",
    items: [
      "دسترسی به دوره‌ها پس از خرید فعال می‌شود",
      "امکان بازگشت وجه تا ۷ روز وجود دارد",
      "گواهی پایان دوره پس از تکمیل صادر می‌شود",
    ],
  },
  {
    icon: Users,
    title: "تعامل کاربران",
    items: [
      "احترام به همه کاربران الزامی است",
      "ارسال محتوای نامناسب ممنوع است",
      "گزارش تخلفات در اختیار کاربران است",
    ],
  },
];

export default function RulesPage() {
  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/"
          className="btn btn-secondary rounded-[var(--radius)] p-2"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-black text-foreground">قوانین</h1>
      </div>

      {/* Intro */}
      <Card className="p-4 mb-4 border-r-4 border-primary">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-foreground">خوش آمدید به رایا</p>
            <p className="text-xs text-foreground-muted">
              این قوانین برای حفظ امنیت و تجربه بهتر کاربران طراحی شده است.
              لطفاً با دقت مطالعه کنید.
            </p>
          </div>
        </div>
      </Card>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground">{rule.title}</h2>
                  <ul className="mt-2 space-y-1.5">
                    {rule.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground-muted">
                        <span className="text-primary mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <Card className="mt-4 p-4 text-center">
        <p className="text-xs text-foreground-muted">
          آخرین بروزرسانی: {new Date().toLocaleDateString("fa-IR")}
        </p>
      </Card>
    </Container>
  );
}