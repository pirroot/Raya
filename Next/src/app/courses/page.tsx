'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Award,
  ChevronLeft,
  Clock3,
  GraduationCap,
  NotebookTabs,
  PlayCircle,
  Search,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useCourses, useCategories } from '@/lib/api/hooks/useCourses';
import type { CoursesQuery } from '@/lib/validation/courses';

const currencyFormatter = new Intl.NumberFormat('fa-IR');

// ===== Level mapping =====
const levelMap: Record<string, string> = {
  beginner: 'مقدماتی',
  intermediate: 'متوسط',
  advanced: 'پیشرفته',
};

export default function CoursesPage() {
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('-created_at');

  // ===== Fetch categories from API =====
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  // ===== Fetch courses from API =====
  const queryParams: CoursesQuery = {
    page: 1,
    limit: 100,
    category: activeCategory || undefined,
    search: searchTerm || undefined,
    sort: sortBy,
  };
  const { data: coursesData, isLoading, error } = useCourses(queryParams);

  // ===== Filtered courses =====
  const filteredCourses = useMemo(() => {
    return coursesData?.results || [];
  }, [coursesData]);

  // ===== Featured course =====
  const featured = filteredCourses.length > 0 ? filteredCourses[0] : null;

  // ===== Total lessons =====
  const totalLessons = filteredCourses.reduce((acc, c) => acc + (c.lessons_count || 0), 0);

  return (
    <main>
      <Container className="pb-24 pt-2 lg:pb-16 lg:pt-4">
        {/* ===== Mini Hero ===== */}
        <div className="mb-4 flex items-center justify-between rounded-[var(--radius)] bg-primary/5 px-4 py-3 ring-1 ring-primary/10">
          <div>
            <p className="text-xs font-black text-primary-text">پلتفرم آموزش</p>
            <p className="text-sm font-bold text-foreground">پکیج‌های ویدیویی و کلاس زنده</p>
          </div>
          <div className="flex gap-3 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <PlayCircle className="h-4 w-4 text-primary" />
              {totalLessons}+ درس
            </span>
            <span className="flex items-center gap-1">
              <Award className="h-4 w-4 text-primary" />
              گواهی پایان
            </span>
          </div>
        </div>

        {/* ===== Search ===== */}
        <div className="relative">
          <Search className="pointer-events-none absolute right-0.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی دوره، مدرس، مهارت..."
            className="input h-11 rounded-[var(--radius)] pr-11 text-sm lg:h-12"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-background-subtle text-foreground-muted transition hover:bg-border"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ===== Categories ===== */}
        <section className="mt-3 lg:mt-4">
          <div className="mb-2 flex items-center justify-between lg:mb-2.5">
            <h2 className="text-xs font-bold text-foreground-muted">دسته‌بندی</h2>
            <span className="badge badge-primary text-[9px]">{filteredCourses.length} پکیج</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-6 lg:gap-2">
            {/* همه */}
            <button
              onClick={() => setActiveCategory('')}
              className={`rounded-[var(--radius)] p-2 text-center shadow-sm transition-all duration-200 active:scale-[0.98] hover:scale-105 hover:shadow-md ${
                !activeCategory
                  ? 'bg-gradient-to-br from-slate-950 via-slate-800 to-slate-600 text-white'
                  : 'bg-card text-foreground ring-1 ring-border hover:ring-border-strong'
              }`}
            >
              <div
                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] ${
                  !activeCategory ? 'bg-white/20' : 'bg-background-subtle text-foreground-muted'
                }`}
              >
                <NotebookTabs className="h-3.5 w-3.5" />
              </div>
              <p className="mt-1 text-[10px] font-black leading-3">همه</p>
              <p className="mt-0.5 text-[8px] font-bold leading-3 text-foreground-muted">
                کل پکیج ها
              </p>
            </button>

            {categoriesLoading ? (
              <Loader2 className="col-span-5 mx-auto h-6 w-6 animate-spin text-primary" />
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-[var(--radius)] p-2 text-center shadow-sm transition-all duration-200 active:scale-[0.98] hover:scale-105 hover:shadow-md ${
                    activeCategory === cat.id
                      ? `bg-gradient-to-br ${cat.gradient || 'from-primary to-secondary'} text-white`
                      : 'bg-card text-foreground ring-1 ring-border hover:ring-border-strong'
                  }`}
                >
                  <div
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] ${
                      activeCategory === cat.id
                        ? 'bg-white/20'
                        : 'bg-background-subtle text-foreground-muted'
                    }`}
                  >
                    <NotebookTabs className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 text-[10px] font-black leading-3">{cat.title}</p>
                  <p
                    className={`mt-0.5 text-[8px] font-bold leading-3 ${
                      activeCategory === cat.id ? 'text-white/75' : 'text-foreground-muted'
                    }`}
                  >
                    {cat.subtitle || ''}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        {/* ===== Loading ===== */}
        {isLoading && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* ===== Error ===== */}
        {error && (
          <Card className="mt-4 p-8 text-center">
            <p className="text-sm text-error">خطا در بارگذاری دوره‌ها</p>
          </Card>
        )}

        {/* ===== Featured Course ===== */}
        {!isLoading && featured && (
          <Card className="mt-3 overflow-hidden p-3 lg:mt-4 lg:p-3.5">
            <div className="flex gap-3">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-primary to-secondary text-white lg:h-24 lg:w-24">
                <GraduationCap className="relative h-9 w-9 lg:h-10 lg:w-10" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[10px] font-black text-error">
                  <Sparkles className="h-3 w-3" />
                  مسیر پیشنهادی امروز
                </div>
                <h2 className="mt-0.5 truncate text-sm font-black text-foreground lg:text-base">
                  {featured.title}
                </h2>
                <p className="mt-0.5 line-clamp-1 text-[10px] font-medium leading-4 text-foreground-muted lg:text-xs">
                  {featured.description}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-foreground-muted">
                  <Clock3 className="h-3 w-3" />
                  {featured.duration || '۰ ساعت'}
                  <span className="h-1 w-1 rounded-full bg-border" />
                  {featured.lessons_count || 0} درس
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ===== Packages Grid ===== */}
        <section className="mt-3 lg:mt-4">
          <div className="mb-2 flex items-center justify-between lg:mb-2.5">
            <h2 className="text-xs font-bold text-foreground-muted">پکیج های یادگیری</h2>
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
            {!isLoading &&
              filteredCourses.map((item) => (
                <article
                  key={item.id}
                  className="card overflow-hidden p-0 transition-all hover:shadow-[var(--shadow-lg)]"
                >
                  <div className="flex gap-2.5 p-2.5 lg:gap-3 lg:p-3">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-primary to-secondary text-white lg:h-20 lg:w-20">
                      {item.badge && (
                        <div className="absolute right-1 top-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[7px] font-black backdrop-blur-sm lg:text-[8px]">
                          {item.badge}
                        </div>
                      )}
                      <GraduationCap className="h-7 w-7 lg:h-9 lg:w-9" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-xs font-black text-foreground lg:text-sm">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-[9px] font-bold text-foreground-muted lg:text-[10px]">
                        {item.teacher_name || 'مدرس'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1 text-[8px] font-black lg:text-[9px]">
                        <span className="badge badge-primary">
                          {levelMap[item.level] || item.level || 'همه سطوح'}
                        </span>
                        <span className="badge badge-success">{item.duration || '۰ ساعت'}</span>
                        <span className="badge badge-success text-amber-400!">
                          {item.rating || 0} ★
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border px-2.5 py-2 lg:px-3 lg:py-2.5">
                    <div>
                      <p className="flex items-baseline gap-1 text-xs font-black lg:text-sm">
                        <span className="text-foreground">
                          {item.price === 0 ? 'رایگان' : currencyFormatter.format(item.price)}
                        </span>
                        {item.price > 0 && (
                          <span className="text-[8px] text-foreground-muted lg:text-[9px]">
                            تومان
                          </span>
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/courses/watch?course=${item.id}`}
                      className="btn btn-primary rounded-[var(--radius)] px-2.5 py-1 text-[9px] lg:px-3 lg:py-1.5 lg:text-xs"
                    >
                      <PlayCircle className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                      مشاهده
                    </Link>
                  </div>
                </article>
              ))}
          </div>

          {/* Empty state */}
          {!isLoading && filteredCourses.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-sm font-bold text-foreground-muted">دوره‌ای پیدا نشد</p>
              <p className="text-xs text-foreground-muted/60">سعی کنید فیلترها را تغییر دهید</p>
            </Card>
          )}
        </section>
      </Container>
    </main>
  );
}
