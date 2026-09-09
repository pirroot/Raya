'use client';

import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import api, { API_ENDPOINTS } from '@/lib/api';
import { isAuthError } from '@/lib/api-error';
import {
  ArrowRight,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  Search,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ===== Types =====
interface PsychologyTest {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  coin_price: number;
  questions_count: number;
  duration: number;
  level: 'simple' | 'medium' | 'advanced';
  rating: number;
  reviews: number;
  is_purchased: boolean;
  is_completed: boolean;
  created_at: string;
}

// ===== Constants =====
const levelMap: Record<string, { label: string; className: string }> = {
  simple: { label: 'ساده', className: 'bg-success/10 text-success' },
  medium: { label: 'متوسط', className: 'bg-warning/10 text-warning' },
  advanced: { label: 'پیشرفته', className: 'bg-error/10 text-error' },
};

const categoryMap: Record<string, string> = {
  personality: 'شخصیت شناسی',
  iq: 'هوش و استعداد',
  academic: 'تحصیلی',
  psychology: 'روانشناسی',
  emotional: 'هوش هیجانی',
};

const currencyFormatter = new Intl.NumberFormat('fa-IR');

export default function PsychologyTestPage() {
  const router = useRouter();
  const [tests, setTests] = useState<PsychologyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('همه');

  const categories = ['همه', 'شخصیت شناسی', 'هوش و استعداد', 'تحصیلی', 'روانشناسی', 'هوش هیجانی'];

  // ===== Load Tests =====
  useEffect(() => {
    const loadTests = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.PSYCHOLOGY_TESTS.LIST);
        const data = Array.isArray(response.data?.results) ? response.data.results : [];
        setTests(data);
      } catch (error) {
        if (isAuthError(error)) {
          router.replace('/auth/mobile');
          return;
        }
        console.error('Error loading tests:', error);
        setTests([]);
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, [router]);

  // ===== Filter =====
  const filteredTests = tests.filter((test) => {
    const matchSearch = test.title.includes(searchTerm) || test.description.includes(searchTerm);
    const matchCategory =
      activeCategory === 'همه' ||
      categoryMap[test.category as keyof typeof categoryMap] === activeCategory;
    return matchSearch && matchCategory;
  });

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
      {/* Search */}
      <div className="flex justify-between gpa-5">
        <div className="mb-4 flex items-center gap-3">
          <Link href="/" className="btn btn-secondary rounded-[var(--radius)] p-2">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/psychology-test/results"
            className="btn btn-secondary rounded-[var(--radius)] p-2"
          >
            نتایج پاسخ نامه
          </Link>
        </div>
      </div>
      <div className="relative">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="جستجوی تست..."
          className="input h-12 rounded-[var(--radius)] pr-12 text-sm"
        />
      </div>

      {/* Categories */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground-muted ring-1 ring-border hover:bg-background-subtle'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tests Grid */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filteredTests.length === 0 ? (
          <div className="col-span-1 lg:col-span-2">
            <Card className="p-8 text-center">
              <Brain className="mx-auto h-10 w-10 text-foreground-muted/30" />
              <p className="mt-2 text-sm font-bold text-foreground-muted">تستی پیدا نشد</p>
              <p className="text-xs text-foreground-muted/60">سعی کنید فیلترها را تغییر دهید</p>
            </Card>
          </div>
        ) : (
          filteredTests.map((test) => (
            <Card
              key={test.id}
              className="p-4 transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-lg)]"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="badge badge-primary text-[9px]">
                      {categoryMap[test.category as keyof typeof categoryMap] || test.category}
                    </span>
                    <h3 className="mt-2 text-base font-black text-foreground">{test.title}</h3>
                    <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
                      {test.description}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-2xl">
                    🧠
                  </div>
                </div>

                {/* Meta */}
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
                  <span
                    className={`badge ${
                      levelMap[test.level]?.className || 'bg-background-subtle'
                    } text-[8px]`}
                  >
                    {levelMap[test.level]?.label || test.level}
                  </span>
                </div>

                {/* Price & Action */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div>
                    {test.is_purchased ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-success">
                        <CheckCircle className="h-4 w-4" />
                        {test.is_completed ? 'تکمیل شده' : 'خریداری شده'}
                      </span>
                    ) : test.price === 0 && test.coin_price === 0 ? (
                      <span className="text-xs font-bold text-success">رایگان</span>
                    ) : (
                      <div className="flex flex-col">
                        {test.price > 0 && (
                          <span className="text-sm font-black text-primary">
                            {currencyFormatter.format(test.price)} تومان
                          </span>
                        )}
                        {test.coin_price > 0 && (
                          <span className="text-[10px] text-foreground-muted">
                            یا {test.coin_price} سکه
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Link
                    href={
                      test.is_purchased
                        ? `/psychology-test/${test.id}`
                        : `/psychology-test/${test.id}/purchase`
                    }
                    className={`btn ${
                      test.is_purchased ? 'btn-primary' : 'btn-primary'
                    } rounded-[var(--radius)] px-4 py-1.5 text-xs`}
                  >
                    {test.is_purchased
                      ? test.is_completed
                        ? 'مشاهده نتیجه'
                        : 'ادامه تست'
                      : test.price === 0 && test.coin_price === 0
                        ? 'شروع تست'
                        : 'خرید و شروع'}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Container>
  );
}
