'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, Clock, Download, X, Loader2, Plus } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { QuestionCard } from '@/components/question-bank/QuestionCard';
import { useQuestions, useCategories } from '@/lib/question-bank/hooks/useQuestions';
import type { QuestionFilters } from '@/lib/question-bank/types';

export default function QuestionBankPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'-views' | '-created_at' | '-likes' | '-downloads'>(
    '-views'
  );

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);

  const filters: QuestionFilters = {
    category: activeCategory || undefined,
    search: searchTerm || undefined,
    sort: sortBy,
  };

  const { data: questions = [], isLoading, error } = useQuestions(filters);
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const clearSearch = () => setSearchTerm('');

  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">📚 بانک سوالات</h1>
        {isLoggedIn ? (
          <Link href="/question-bank/upload" className="btn btn-primary text-sm">
            <Plus className="h-4 w-4" />
            آپلود سوال
          </Link>
        ) : (
          <button
            onClick={() => router.push('/auth/login?redirect=/question-bank/upload')}
            className="btn btn-secondary text-sm"
          >
            برای آپلود وارد شوید
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="جستجوی سوال، جزوه، مدرس..."
          className="input h-12 rounded-[var(--radius)] pr-12 text-sm"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-background-subtle"
          >
            <X className="h-4 w-4 text-foreground-muted" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('')}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            !activeCategory
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-foreground-muted ring-1 ring-border hover:bg-background-subtle'
          }`}
        >
          همه
        </button>
        {categoriesLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
        ) : (
          safeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                activeCategory === cat.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground-muted ring-1 ring-border hover:bg-background-subtle'
              }`}
            >
              {cat.title}
            </button>
          ))
        )}
      </div>

      {/* Sort & Filter */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {[
            { value: '-views', label: 'محبوب‌ترین', icon: TrendingUp },
            { value: '-created_at', label: 'جدیدترین', icon: Clock },
            { value: '-downloads', label: 'بیشترین دانلود', icon: Download },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value as any)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
                sortBy === opt.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-foreground-muted">
          {isLoading ? '...' : `${questions.length} نتیجه`}
        </span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="mt-4 p-8 text-center">
          <p className="text-sm text-error">خطا در بارگذاری سوالات</p>
        </Card>
      )}

      {/* Questions Grid */}
      <div className="mt-4 space-y-3">
        {!isLoading && questions.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-bold text-foreground-muted">سوالی پیدا نشد</p>
            <p className="text-xs text-foreground-muted/60">سعی کنید فیلترها را تغییر دهید</p>
          </Card>
        ) : (
          questions.map((q) => <QuestionCard key={q.id} question={q} variant="default" />)
        )}
      </div>
    </Container>
  );
}
