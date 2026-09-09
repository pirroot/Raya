'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';
import { isAuthError } from '@/lib/api-error';

// ===== Types =====
interface Option {
  id: string;
  label: string;
}

interface Question {
  id: string;
  question: string;
  order: number;
  options: Option[];
}

interface SubmitAnswer {
  question_id: string;
  option_id: string;
}

// ===== Component =====
export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== Load Questions =====
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.PSYCHOLOGY_TESTS.QUESTIONS(testId));
        const data = Array.isArray(response.data?.results) ? response.data.results : [];
        setQuestions(data);
      } catch (error) {
        if (isAuthError(error)) {
          router.replace('/auth/mobile');
          return;
        }
        console.error('Error loading questions:', error);
        setError('خطا در دریافت سوالات');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      loadQuestions();
    }
  }, [testId, router]);

  // ===== Handlers =====
  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      alert('لطفاً به همه سوالات پاسخ دهید');
      return;
    }

    setSubmitting(true);
    try {
      const payload: SubmitAnswer[] = Object.entries(answers).map(([question_id, option_id]) => ({
        question_id,
        option_id,
      }));

      await api.post(API_ENDPOINTS.PSYCHOLOGY_TESTS.COMPLETE(testId), {
        answers: payload,
      });

      setIsCompleted(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('خطا در ثبت پاسخ‌ها');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Loading =====
  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Container>
    );
  }

  // ===== Error =====
  if (error || questions.length === 0) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center">
        <p className="text-lg font-bold text-foreground-muted">
          {error || 'سوالی برای این تست وجود ندارد'}
        </p>
        <Link href="/psychology-test" className="btn btn-primary mt-4">
          بازگشت به لیست تست‌ها
        </Link>
      </Container>
    );
  }

  // ===== Completed =====
  if (isCompleted) {
    return (
      <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
        <Card className="p-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-4 text-2xl font-black text-foreground">تست تکمیل شد! ✅</h1>
          <p className="mt-2 text-foreground-muted">پاسخ‌های شما با موفقیت ثبت شد.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/psychology-test/results/${testId}`} className="btn btn-primary">
              مشاهده پاسخنامه
            </Link>
            <Link href="/psychology-test" className="btn btn-secondary">
              بازگشت به لیست تست‌ها
            </Link>
          </div>
        </Card>
      </Container>
    );
  }

  const question = questions[currentQuestion];
  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const hasAnswered = Boolean(answers[question?.id]);
  const answeredCount = Object.keys(answers).length;

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/psychology-test" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-foreground">تست روانشناسی</h1>
      </div>

      {/* Progress */}
      <div className="mb-4 flex items-center justify-between text-sm text-foreground-muted">
        <span>
          سوال {currentQuestion + 1} از {totalQuestions}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background-subtle">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <Card className="mt-4 p-6">
        {/* ===== نمایش سوال ===== */}
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
              {currentQuestion + 1}
            </span>
            <p className="text-base font-black text-foreground mt-1 leading-7">
              {question?.question || 'سوالی وجود ندارد'}
            </p>
          </div>

          {/* ===== گزینه‌ها ===== */}
          <div className="space-y-3 pr-11">
            {question?.options && question.options.length > 0 ? (
              question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(question.id, option.id)}
                    className={`w-full rounded-[var(--radius)] border-2 p-4 text-right transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-background-subtle'
                    }`}
                  >
                    <span className="text-sm text-foreground">{option.label}</span>
                    {isSelected && <CheckCircle className="float-left h-5 w-5 text-primary" />}
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-foreground-muted">گزینه‌ای برای این سوال وجود ندارد</p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
          <button
            onClick={handlePrev}
            disabled={currentQuestion === 0}
            className="btn btn-secondary disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
            قبلی
          </button>
          <span className="text-xs text-foreground-muted">
            {answeredCount} از {totalQuestions} پاسخ داده شده
          </span>
          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={answeredCount !== totalQuestions || submitting}
              className="btn btn-success disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  ثبت و پایان
                  <CheckCircle className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!hasAnswered}
              className="btn btn-primary disabled:opacity-50"
            >
              بعدی
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </Card>
    </Container>
  );
}
