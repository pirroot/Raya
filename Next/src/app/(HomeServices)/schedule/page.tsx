'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, User, BookOpen, Clock, Filter, X, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';

// ===== Types =====
interface ClassSchedule {
  id: string;
  course_name: string;
  teacher: string;
  day: string;
  time: string;
  faculty: string;
  room?: string;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState('همه');
  const [selectedFaculty, setSelectedFaculty] = useState('همه');

  const days = ['همه', 'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

  // ===== Load Data =====
  useEffect(() => {
    const loadData = async () => {
      try {
        const [schedulesRes, facultiesRes] = await Promise.all([
          api.get(API_ENDPOINTS.SCHEDULE.LIST),
          api.get(API_ENDPOINTS.SCHEDULE.FACULTIES),
        ]);

        setSchedules(schedulesRes.data?.results || []);
        setFaculties(facultiesRes.data || []);
      } catch (error) {
        console.error('Error loading schedule:', error);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ===== Filter =====
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      const matchSearch =
        item.course_name.includes(searchTerm) ||
        item.teacher.includes(searchTerm) ||
        (item.room && item.room.includes(searchTerm));
      const matchDay = selectedDay === 'همه' || item.day === selectedDay;
      const matchFaculty = selectedFaculty === 'همه' || item.faculty === selectedFaculty;
      return matchSearch && matchDay && matchFaculty;
    });
  }, [schedules, searchTerm, selectedDay, selectedFaculty]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDay('همه');
    setSelectedFaculty('همه');
  };

  const hasActiveFilters = searchTerm || selectedDay !== 'همه' || selectedFaculty !== 'همه';

  // ===== Stats =====
  const totalCourses = new Set(schedules.map((s) => s.course_name)).size;
  const totalTeachers = new Set(schedules.map((s) => s.teacher)).size;

  // ===== Loading =====
  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="btn btn-secondary rounded-[var(--radius)] p-2">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-black text-foreground">📚 برنامه کلاسی</h1>
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn btn-ghost text-xs text-foreground-muted">
            <X className="h-4 w-4" />
            پاک کردن فیلترها
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی درس، استاد، کلاس..."
            className="input h-12 rounded-[var(--radius)] pr-12 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-background-subtle"
            >
              <X className="h-4 w-4 text-foreground-muted" />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <p className="text-lg font-black text-foreground">{schedules.length}</p>
            <p className="text-[10px] text-foreground-muted">کل کلاس‌ها</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-black text-primary">{totalCourses}</p>
            <p className="text-[10px] text-foreground-muted">درس‌های مختلف</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-black text-success">{totalTeachers}</p>
            <p className="text-[10px] text-foreground-muted">اساتید</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-foreground-muted">روز</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="input mt-1 h-11 text-sm"
            >
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground-muted">دانشکده</label>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="input mt-1 h-11 text-sm"
            >
              <option value="همه">همه</option>
              {faculties.map((faculty) => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-4 flex items-center justify-between text-sm text-foreground-muted">
        <span>{filteredSchedules.length} کلاس</span>
        {hasActiveFilters && (
          <span className="text-xs">
            فیلترهای فعال:{' '}
            {[
              searchTerm && `"${searchTerm}"`,
              selectedDay !== 'همه' && selectedDay,
              selectedFaculty !== 'همه' && selectedFaculty,
            ]
              .filter(Boolean)
              .join(' • ')}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <Card className="overflow-hidden">
          <div className="min-w-full">
            {/* Header */}
            <div className="grid grid-cols-4 gap-3 border-b border-border bg-background-subtle px-4 py-3 text-xs font-bold text-foreground-muted lg:grid-cols-5">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                درس
              </div>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                استاد
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                روز
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                ساعت
              </div>
              <div className="hidden lg:flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                دانشکده
              </div>
            </div>

            {/* Body */}
            {filteredSchedules.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-foreground-muted">کلاسی پیدا نشد</p>
                <p className="text-xs text-foreground-muted/60">سعی کنید فیلترها را تغییر دهید</p>
              </div>
            ) : (
              filteredSchedules.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-4 gap-3 border-b border-border px-4 py-3 text-sm transition-all hover:bg-background-subtle last:border-0 lg:grid-cols-5"
                >
                  <div className="font-black text-foreground">{item.course_name}</div>
                  <div className="text-foreground-muted">{item.teacher}</div>
                  <div>
                    <span className="badge badge-primary text-[10px]">{item.day}</span>
                  </div>
                  <div className="text-foreground-muted">{item.time}</div>
                  <div className="hidden text-xs text-foreground-muted lg:block">
                    {item.faculty}
                    {item.room && <span className="mr-1">• {item.room}</span>}
                  </div>
                  {/* Mobile */}
                  <div className="col-span-4 text-xs text-foreground-muted/60 lg:hidden">
                    {item.faculty}
                    {item.room && <span className="mr-1">• {item.room}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
}
