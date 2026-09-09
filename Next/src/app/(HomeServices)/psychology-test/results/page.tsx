'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Brain, Loader2, CheckCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';
import { isAuthError } from '@/lib/api-error';

interface TestResult {
  id: string;
  test: {
    id: string;
    title: string;
  };
  score: number;
  total_questions: number;
  percentage: number | string;
  completed_at: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ===== تبدیل percentage به عدد =====
function getPercentage(value: number | string): number {
  if (typeof value === 'string') {
    return parseFloat(value) || 0;
  }
  return value || 0;
}

export default function MyResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.PSYCHOLOGY_TESTS.MY_RESULTS);
        const data = Array.isArray(response.data?.results) ? response.data.results : [];
        setResults(data);
      } catch (error) {
        if (isAuthError(error)) {
          router.replace('/auth/mobile');
          return;
        }
        console.error('Error loading results:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [router]);

  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/psychology-test" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-foreground">📋 پاسخنامه‌های من</h1>
      </div>

      {results.length === 0 ? (
        <Card className="p-8 text-center">
          <Brain className="mx-auto h-10 w-10 text-foreground-muted/30" />
          <p className="mt-2 text-sm font-bold text-foreground-muted">هنوز تستی انجام ندادید</p>
          <Link href="/psychology-test" className="btn btn-primary mt-4">
            شروع تست
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5">
          {results.map((result) => {
            const percentage = getPercentage(result.percentage);
            return (
              <Link key={result.id} href={`/psychology-test/results/${result.test.id}`}>
                <Card className="p-4 transition-all hover:shadow-[var(--shadow-lg)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-foreground">{result.test.title}</h3>
                      <p className="text-xs text-foreground-muted">
                        {formatDate(result.completed_at)}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-primary">{percentage.toFixed(0)}%</p>
                      <p className="text-[10px] text-foreground-muted">
                        {result.score} از {result.total_questions}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
