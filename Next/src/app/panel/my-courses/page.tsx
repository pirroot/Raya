'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, PlayCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useMyCourses } from '@/lib/api/hooks/useCourses';

function toLocaleDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function MyCoursesPage() {
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  // ===== استفاده از هوک =====
  const { data: coursesData, isLoading, error } = useMyCourses();

  // ===== تبدیل داده‌ها =====
  const courses = (coursesData || []).map((course: any) => ({
    id: course.id,
    title: course.title,
    teacher_name: course.teacher_name || 'مدرس',
    progress: course.progress || 0,
    lessons_count: course.lessons_count || 0,
    completed_lessons: course.completed_lessons || 0,
    last_watched_at: course.last_watched_at,
    thumbnail: course.thumbnail,
  }));

  // ===== Filter =====
  const filteredCourses = courses.filter((course) => {
    if (filter === 'all') return true;
    if (filter === 'in-progress') return course.progress < 100 && course.progress > 0;
    if (filter === 'completed') return course.progress === 100;
    return true;
  });

  // ===== Stats =====
  const totalCourses = courses.length;
  const avgProgress =
    totalCourses > 0
      ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / totalCourses)
      : 0;
  const totalLessons = courses.reduce((acc, c) => acc + (c.completed_lessons || 0), 0);

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/panel" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-black text-foreground">دوره‌های من</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="p-3 text-center">
          {isLoading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
          ) : (
            <p className="text-lg font-black text-foreground">{totalCourses}</p>
          )}
          <p className="text-[10px] text-foreground-muted">دوره</p>
        </Card>
        <Card className="p-3 text-center">
          {isLoading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
          ) : (
            <p className="text-lg font-black text-primary">{avgProgress}%</p>
          )}
          <p className="text-[10px] text-foreground-muted">میانگین پیشرفت</p>
        </Card>
        <Card className="p-3 text-center">
          {isLoading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
          ) : (
            <p className="text-lg font-black text-success">{totalLessons}</p>
          )}
          <p className="text-[10px] text-foreground-muted">درس خوانده</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background-subtle text-foreground-muted hover:bg-background-subtle/80'
          }`}
        >
          همه
        </button>
        <button
          onClick={() => setFilter('in-progress')}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
            filter === 'in-progress'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background-subtle text-foreground-muted hover:bg-background-subtle/80'
          }`}
        >
          در حال یادگیری
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
            filter === 'completed'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background-subtle text-foreground-muted hover:bg-background-subtle/80'
          }`}
        >
          تکمیل شده
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="p-8 text-center">
          <p className="text-sm text-error">خطا در دریافت دوره‌ها</p>
        </Card>
      )}

      {/* Courses */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {filteredCourses.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-foreground-muted/30" />
              <p className="mt-2 text-sm font-bold text-foreground-muted">
                {filter === 'all'
                  ? 'دوره‌ای پیدا نشد'
                  : filter === 'in-progress'
                    ? 'دوره در حال یادگیری ندارید'
                    : 'دوره تکمیل شده ندارید'}
              </p>
              <Link
                href="/courses"
                className="mt-2 inline-block text-xs font-bold text-primary hover:text-primary-hover"
              >
                مرور دوره‌ها
              </Link>
            </Card>
          ) : (
            filteredCourses.map((course) => (
              <Card key={course.id} className="p-4 transition-all hover:shadow-[var(--shadow-lg)]">
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-6 w-6" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="truncate text-sm font-black text-foreground">
                          {course.title}
                        </p>
                        <p className="text-xs text-foreground-muted">{course.teacher_name}</p>
                      </div>
                      {course.progress === 100 && (
                        <span className="badge bg-success/10 text-success text-[9px] shrink-0">
                          <CheckCircle2 className="h-3 w-3" />
                          تکمیل
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-[10px] text-foreground-muted">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {course.completed_lessons || 0}/{course.lessons_count} درس
                      </span>
                      {course.last_watched_at && (
                        <span className="flex items-center gap-0.5">
                          آخرین: {toLocaleDate(course.last_watched_at)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-background-subtle">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-primary-hover to-primary transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-foreground">
                        {course.progress}%
                      </span>
                    </div>

                    <Link
                      href={`/courses/watch?course=${course.id}`}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      {course.progress === 100 ? 'مشاهده مجدد' : 'ادامه یادگیری'}
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </Container>
  );
}
