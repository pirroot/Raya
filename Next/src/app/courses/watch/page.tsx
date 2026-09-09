'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  MessageCircle,
  Play,
  PlayCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Tag,
  X,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import {
  useCourse,
  useCourseLessons,
  useEnrollCourse,
  useUpdateProgress,
  courseKeys,
} from '@/lib/api/hooks/useCourses';
import { useValidateGift, useApplyGift } from '@/lib/api/hooks/useGifts';

const numberFormat = new Intl.NumberFormat('fa-IR');

// ===== Video Player =====
function VideoPlayer({
  url,
  thumbnail,
  title,
}: {
  url: string;
  thumbnail?: string;
  title?: string;
}) {
  const [error, setError] = useState(false);

  if (!url) {
    return (
      <div className="relative aspect-video w-full rounded-[var(--radius-xl)] bg-black/50 flex flex-col items-center justify-center text-white">
        <Play className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-2 text-sm font-medium">ویدیویی برای این درس وجود ندارد</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative aspect-video w-full rounded-[var(--radius-xl)] bg-black flex flex-col items-center justify-center text-white">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="mt-3 text-sm font-medium">خطا در پخش ویدیو</p>
        <button
          onClick={() => setError(false)}
          className="mt-2 text-xs text-white/60 hover:text-white"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-xl)] bg-black">
      <video
        src={url}
        controls
        className="h-full w-full object-cover bg-black"
        poster={thumbnail}
        playsInline
        controlsList="nodownload"
        onError={() => setError(true)}
      />
    </div>
  );
}

// ===== Watch Content =====
function WatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = searchParams.get('course');
  const [showAllLessons, setShowAllLessons] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // ===== Coupon States =====
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedGift, setAppliedGift] = useState<any>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const validateGift = useValidateGift();
  const applyGift = useApplyGift();

  // ===== Fetch course data =====
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
    refetch: refetchCourse,
  } = useCourse(courseId || '');
  const { data: lessons = [], isLoading: lessonsLoading } = useCourseLessons(courseId || '');
  const enrollMutation = useEnrollCourse();
  const progressMutation = useUpdateProgress();

  // ===== درس فعلی =====
  const currentLesson = lessons[selectedLessonIndex] || lessons[0];
  const isEnrolled = course?.is_enrolled || false;

  // ===== بعد از لود شدن درس‌ها، اولین درس رو انتخاب کن =====
  useEffect(() => {
    if (lessons.length > 0) {
      setSelectedLessonIndex(0);
    }
  }, [lessons]);

  // ===== Coupon Handlers =====
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !course) return;
    setCouponError(null);
    setIsCouponLoading(true);
    try {
      const result = await validateGift.mutateAsync({
        code: couponCode,
        total_amount: course.price || 0,
        order_type: 'courses',
      });

      if (result.valid) {
        setAppliedGift(result.gift);
        setCouponDiscount(result.discount);
        setShowCouponInput(false);
      } else {
        setCouponError(result.message || 'کد تخفیف نامعتبر است');
      }
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'کد تخفیف نامعتبر است');
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedGift(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  // ===== ثبت‌نام خودکار در دوره‌های رایگان =====
  useEffect(() => {
    if (
      course &&
      course.price === 0 &&
      !isEnrolled &&
      courseId &&
      !enrollMutation.isPending &&
      !isProcessing
    ) {
      setIsProcessing(true);
      enrollMutation.mutate(courseId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
          queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
          queryClient.invalidateQueries({ queryKey: courseKeys.lessons(courseId) });
          window.location.href = `/courses/watch?course=${courseId}`;
        },
        onError: () => setIsProcessing(false),
      });
    }
  }, [course, isEnrolled, courseId, enrollMutation, queryClient, isProcessing]);

  // ===== Handle enrollment =====
  const handleEnroll = async () => {
    if (!courseId || isProcessing) return;
    setEnrollError(null);
    setIsProcessing(true);

    try {
      // اعمال کد تخفیف
      if (appliedGift && course.price > 0) {
        await applyGift.mutateAsync({
          code: appliedGift.code,
          total_amount: course.price,
          order_type: 'courses',
          order_id: `COURSE-${courseId}-${Date.now()}`,
        });
      }

      enrollMutation.mutate(courseId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
          queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
          queryClient.invalidateQueries({ queryKey: courseKeys.lessons(courseId) });
          window.location.href = `/courses/watch?course=${courseId}`;
        },
        onError: (error: any) => {
          setIsProcessing(false);
          if (error.response?.status === 400) {
            const message = error.response?.data?.error || '';
            if (message.includes('کیف پول') || message.includes('موجودی')) {
              setEnrollError('موجودی کیف پول کافی نیست. لطفاً کیف پول خود را شارژ کنید.');
            } else {
              setEnrollError(message);
            }
          } else {
            setEnrollError('خطا در ثبت‌نام دوره');
          }
        },
      });
    } catch (error) {
      setIsProcessing(false);
      setEnrollError('خطا در اعمال کد تخفیف');
    }
  };

  // ===== کلیک روی درس =====
  const handleLessonClick = (index: number) => {
    setSelectedLessonIndex(index);
    const progress = Math.round(((index + 1) / lessons.length) * 100);
    if (progress > (course?.progress || 0)) {
      progressMutation.mutate({ courseId, progress });
    }
  };

  // ===== Loading =====
  if (courseLoading || lessonsLoading) {
    return (
      <Container className="max-w-md pb-24 pt-2 lg:pb-16 lg:pt-4">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Container>
    );
  }

  // ===== Not Found =====
  if (courseError || !course) {
    return (
      <Container className="max-w-md pb-24 pt-2 lg:pb-16 lg:pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/courses"
            className="card flex h-9 w-9 items-center justify-center p-0 hover:scale-105 transition-all"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <h1 className="text-sm font-black text-foreground">دوره پیدا نشد</h1>
        </div>
        <Card className="p-8 text-center">
          <p className="text-sm font-bold text-foreground-muted">دوره‌ای با این شناسه وجود ندارد</p>
          <Link href="/courses" className="btn btn-primary mt-4">
            بازگشت به دوره‌ها
          </Link>
        </Card>
      </Container>
    );
  }

  const finalPrice = Math.max(0, (course.price || 0) - couponDiscount);

  // ===== صفحه محدودیت برای دوره‌های پولی ثبت‌نام نشده =====
  if (!isEnrolled && course.price > 0) {
    return (
      <Container className="max-w-md pb-24 pt-2 lg:pb-16 lg:pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/courses"
            className="card flex h-9 w-9 items-center justify-center p-0 hover:scale-105 transition-all"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <h1 className="text-sm font-black text-foreground">{course.title}</h1>
        </div>

        <Card className="p-6 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-lg font-black text-foreground">دسترسی محدود</h2>
          <p className="mt-2 text-sm text-foreground-muted">
            برای دسترسی به محتوای این دوره، ابتدا باید ثبت‌نام کنید.
          </p>

          <div className="mt-4 p-4 rounded-[var(--radius)] bg-background-subtle">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">قیمت دوره:</span>
              <span className="font-black text-primary">
                {numberFormat.format(finalPrice)} تومان
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="mt-1 flex justify-between text-sm text-success">
                <span>تخفیف:</span>
                <span>-{numberFormat.format(couponDiscount)} تومان</span>
              </div>
            )}
          </div>

          {/* ===== کد تخفیف ===== */}
          <div className="mt-4">
            {!showCouponInput && !appliedGift ? (
              <button
                onClick={() => setShowCouponInput(true)}
                className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
              >
                <Tag className="h-3 w-3" />
                کد تخفیف دارید؟
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="کد تخفیف"
                  className="input flex-1 h-9 text-sm"
                  disabled={!!appliedGift}
                  autoFocus
                />
                {appliedGift ? (
                  <button onClick={handleRemoveCoupon} className="btn btn-error h-9 px-2 text-sm">
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isCouponLoading || !couponCode.trim()}
                    className="btn btn-secondary h-9 px-3 text-sm"
                  >
                    {isCouponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'اعمال'}
                  </button>
                )}
              </div>
            )}
            {couponError && (
              <div className="mt-1 flex items-center gap-1 text-xs text-error">
                <AlertCircle className="h-3 w-3" />
                {couponError}
              </div>
            )}
            {appliedGift && (
              <div className="mt-1 flex items-center gap-1 text-xs text-success animate-in fade-in justify-center">
                <CheckCircle2 className="h-3 w-3" />
                کد تخفیف {appliedGift.code} اعمال شد
              </div>
            )}
          </div>

          {enrollError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1 leading-5">{enrollError}</span>
              {enrollError.includes('کیف پول') && (
                <button
                  onClick={() => router.push('/panel/wallet')}
                  className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-white font-medium hover:bg-amber-700 active:scale-95 transition"
                >
                  شارژ کیف پول
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleEnroll}
            disabled={enrollMutation.isPending || isProcessing}
            className="btn btn-primary w-full mt-4"
          >
            {enrollMutation.isPending || isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `ثبت‌نام در دوره (${numberFormat.format(finalPrice)} تومان)`
            )}
          </button>
        </Card>
      </Container>
    );
  }

  // ===== محتوای دوره =====
  const displayedLessons = showAllLessons ? lessons : lessons.slice(0, 3);
  const hasMoreLessons = lessons.length > 3;

  return (
    <Container className="max-w-md pb-24 pt-2 lg:pb-16 lg:pt-4">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <Link
          href="/courses"
          className="card flex h-9 w-9 items-center justify-center p-0 hover:scale-105 transition-all"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-sm font-black text-foreground">کلاس ویدیویی</h1>
        <div className="w-9" />
      </div>

      {/* ===== Video Player ===== */}
      <section className="mt-3 overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-primary via-primary-hover to-secondary shadow-[var(--shadow-xl)]">
        <VideoPlayer
          key={currentLesson?.id || currentLesson?.video_url || selectedLessonIndex}
          url={currentLesson?.video_url}
          thumbnail={course?.thumbnail}
          title={currentLesson?.title}
        />
      </section>

      {/* ===== Course Info ===== */}
      <Card className="mt-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-foreground lg:text-base">{course.title}</h2>
            <p className="mt-0.5 text-xs font-bold text-foreground-muted">
              مدرس: {course.teacher_name || 'نامشخص'}
            </p>
          </div>
          <span className="badge badge-success text-amber-400! text-[10px]">
            <Star className="h-3 w-3 fill-current" />
            {course.rating || 0}
          </span>
        </div>
      </Card>

      {/* ===== Quick Actions ===== */}
      <section className="mt-3 grid grid-cols-3 gap-1.5">
        {[
          { label: course.duration || '۰ ساعت', title: 'زمان دوره', icon: Clock3 },
          { label: 'جزوه PDF', title: 'فایل آموزشی', icon: FileText },
          { label: 'پرسش از مدرس', title: 'پشتیبانی', icon: MessageCircle },
        ].map(({ label, title, icon: Icon }) => (
          <div
            key={title}
            className="card p-2 text-center transition-all hover:scale-105 hover:shadow-[var(--shadow-lg)]"
          >
            <Icon className="mx-auto h-4 w-4 text-primary" />
            <p className="mt-1 text-[8px] font-bold text-foreground-muted">{title}</p>
            <p className="mt-0.5 text-[9px] font-black text-foreground">{label}</p>
          </div>
        ))}
      </section>

      {/* ===== Lessons ===== */}
      <Card className="mt-3 p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-black text-foreground">جلسات</h2>
          {course?.attachment_url && (
            <a
              href={course.attachment_url}
              download
              className="btn btn-secondary rounded-[var(--radius)] px-2.5 py-1 text-[10px]"
            >
              <Download className="h-3 w-3" />
              جزوه
            </a>
          )}
        </div>

        <div className="space-y-1.5">
          {displayedLessons.map((lesson, index) => (
            <div
              key={lesson.id || index}
              onClick={() => handleLessonClick(index)}
              className={`flex items-center gap-2.5 rounded-[var(--radius)] p-2 transition-all cursor-pointer ${
                lesson.is_completed
                  ? 'bg-success/5 ring-1 ring-success/20'
                  : index === selectedLessonIndex
                    ? 'bg-primary-soft ring-1 ring-primary/20'
                    : 'bg-background-subtle hover:bg-background-subtle/80'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${
                  lesson.is_completed
                    ? 'bg-success/10 text-success'
                    : index === selectedLessonIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground-muted'
                }`}
              >
                {lesson.is_completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-xs font-black ${index === selectedLessonIndex ? 'text-primary' : 'text-foreground'}`}
                >
                  {index + 1}. {lesson.title}
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-foreground-muted">
                  {lesson.duration}
                </p>
              </div>
              {lesson.is_completed && (
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              )}
            </div>
          ))}
        </div>

        {hasMoreLessons && (
          <button
            onClick={() => setShowAllLessons(!showAllLessons)}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] bg-background-subtle py-2 text-[10px] font-bold text-foreground-muted transition-all hover:bg-background-subtle/80"
          >
            {showAllLessons ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> نمایش کمتر
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> نمایش همه ({lessons.length} جلسه)
              </>
            )}
          </button>
        )}
      </Card>
    </Container>
  );
}

// ===== Page =====
export default function CourseWatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
