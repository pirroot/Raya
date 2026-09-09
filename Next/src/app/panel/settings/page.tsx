'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Bell, Globe, Shield, Moon, Sun, Monitor, CheckCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/lib/useTheme';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('fa');
  const [notifications, setNotifications] = useState('all');
  const [isSaved, setIsSaved] = useState(false);

  const themeOptions = [
    { value: 'light', icon: <Sun className="h-4 w-4" />, label: 'روشن' },
    { value: 'dark', icon: <Moon className="h-4 w-4" />, label: 'تاریک' },
    { value: 'system', icon: <Monitor className="h-4 w-4" />, label: 'سیستم' },
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      {/* ===== Header ===== */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel"
          className="btn btn-secondary rounded-[var(--radius)] p-2.5 hover:scale-105 transition-all active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black">تنظیمات</h1>
      </div>

      <div className="space-y-4">
        {/* ===== Theme ===== */}
        <Card className="p-4 transition-all hover:shadow-[var(--shadow-lg)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-[var(--radius-sm)] bg-primary-soft p-2 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">تم</h3>
                <p className="text-xs text-foreground-muted">انتخاب حالت نمایش</p>
              </div>
            </div>
            <div className="flex gap-1 rounded-full bg-background-subtle p-1">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value as 'light' | 'dark' | 'system')}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all ${
                    theme === opt.value
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-subtle'
                  }`}
                >
                  {opt.icon}
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ===== Language ===== */}
        <Card className="p-4 transition-all hover:shadow-[var(--shadow-lg)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-[var(--radius-sm)] bg-emerald-50 dark:bg-emerald-950/30 p-2 text-emerald-500">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">زبان</h3>
                <p className="text-xs text-foreground-muted">انتخاب زبان برنامه</p>
              </div>
            </div>
            <div className="flex gap-1 rounded-full bg-background-subtle p-1">
              {[
                { value: 'fa', label: 'فارسی' },
                { value: 'en', label: 'EN' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLanguage(opt.value)}
                  className={`rounded-full px-3 py-1 text-sm font-bold transition-all ${
                    language === opt.value
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-subtle'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ===== Notifications ===== */}
        <Card className="p-4 transition-all hover:shadow-[var(--shadow-lg)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-[var(--radius-sm)] bg-amber-50 dark:bg-amber-950/30 p-2 text-amber-500">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">اعلان‌ها</h3>
                <p className="text-xs text-foreground-muted">دریافت اعلان‌ها</p>
              </div>
            </div>
            <div className="flex gap-1 rounded-full bg-background-subtle p-1">
              {[
                { value: 'all', label: 'همه' },
                { value: 'important', label: 'مهم' },
                { value: 'none', label: 'خاموش' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNotifications(opt.value)}
                  className={`rounded-full px-3 py-1 text-sm font-bold transition-all ${
                    notifications === opt.value
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-subtle'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ===== Save Button ===== */}
        <button
          onClick={handleSave}
          className="btn btn-primary w-full text-sm h-12 font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
        >
          {isSaved ? (
            <>
              <CheckCircle className="h-5 w-5" />
              ذخیره شد ✅
            </>
          ) : (
            'ذخیره تنظیمات'
          )}
        </button>

        {/* ===== Version ===== */}
        <Card className="p-4 text-center bg-background-subtle/50">
          <p className="text-sm text-foreground-muted">🚀 رایا - نسخه ۱.۰.۰</p>
        </Card>
      </div>
    </Container>
  );
}
