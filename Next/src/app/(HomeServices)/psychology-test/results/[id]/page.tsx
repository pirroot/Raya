'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle, XCircle, Clock, Brain, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';
import { isAuthError } from '@/lib/api-error';

// ===== Types =====
interface Answer {
  question: string;
  selected_option_label: string;
  is_correct: boolean;
}

interface TestResult {
  id: string;
  test: {
    id: string;
    title: string;
  };
  score: number;
  total_questions: number;
  percentage: number | string; // ← میتونه string یا number باشه
  completed_at: string;
  answers: Answer[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function TestResultsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== Load Result =====
  useEffect(() => {
    const loadResult = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.PSYCHOLOGY_TESTS.RESULT(testId));
        setResult(response.data);
      } catch (error) {
        if (isAuthError(error)) {
          router.replace('/auth/mobile');
          return;
        }
        console.error('Error loading result:', error);
        setError('نتیجه‌ای برای این تست پیدا نشد');
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      loadResult();
    }
  }, [testId, router]);

  // ===== Loading =====
  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Container>
    );
  }

  // ===== Error =====
  if (error || !result) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center">
        <p className="text-lg font-bold text-foreground-muted">{error || 'نتیجه‌ای یافت نشد'}</p>
        <Link href="/psychology-test" className="btn btn-primary mt-4">
          بازگشت به لیست تست‌ها
        </Link>
      </Container>
    );
  }

  // ===== تبدیل percentage به عدد =====
  const percentage =
    typeof result.percentage === 'string' ? parseFloat(result.percentage) : result.percentage;

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/psychology-test" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-foreground">پاسخنامه</h1>
      </div>

      {/* Result Card */}
      <Card className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
            🧠
          </div>
          <h2 className="mt-3 text-xl font-black text-foreground">{result.test.title}</h2>
          <p className="text-sm text-foreground-muted">تاریخ: {formatDate(result.completed_at)}</p>

          <div className="mt-4 flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-black text-success">{result.score}</p>
              <p className="text-xs text-foreground-muted">امتیاز</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-foreground">{result.total_questions}</p>
              <p className="text-xs text-foreground-muted">کل سوالات</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-primary">{percentage.toFixed(0)}%</p>
              <p className="text-xs text-foreground-muted">درصد</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Answers Detail */}
      <Card className="mt-4 p-6">
        <h3 className="text-base font-black text-foreground mb-4">جزئیات پاسخ‌ها</h3>
        <div className="space-y-3">
          {result.answers && result.answers.length > 0 ? (
            result.answers.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-[var(--radius)] border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground-muted">{index + 1}.</span>
                  <span className="text-sm text-foreground">{item.question}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      item.is_correct ? 'text-success' : 'text-error'
                    }`}
                  >
                    {item.selected_option_label}
                  </span>
                  {item.is_correct ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-error" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-foreground-muted">پاسخ‌ها موجود نیست</p>
          )}
        </div>
        <Link href="/psychology-test" className="btn btn-secondary mt-4 w-full">
          بازگشت به لیست تست‌ها
        </Link>
      </Card>
    </Container>
  );
}
