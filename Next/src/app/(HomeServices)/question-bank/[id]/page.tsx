'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Heart,
  Download,
  Eye,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Tag,
  X,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import {
  useQuestion,
  useLikeQuestion,
  useDownloadQuestion,
} from '@/lib/question-bank/hooks/useQuestions';
import { useValidateGift, useApplyGift } from '@/lib/api/hooks/useGifts';
import api, { API_ENDPOINTS } from '@/lib/api';

const numberFormat = new Intl.NumberFormat('fa-IR');

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;

  // ===== States =====
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isCheckingPurchase, setIsCheckingPurchase] = useState(true);

  // ===== Coupon States =====
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedGift, setAppliedGift] = useState<any>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);

  // ===== React Query =====
  const { data: question, isLoading, error, refetch } = useQuestion(questionId);
  const likeMutation = useLikeQuestion();
  const downloadMutation = useDownloadQuestion();
  const validateGift = useValidateGift();
  const applyGift = useApplyGift();

  // ===== Update local state when question loads =====
  useEffect(() => {
    if (question) {
      setIsLiked(question.is_liked || false);
      setLikesCount(question.likes || 0);
      setIsPurchased(question.is_purchased || false);
      setIsCheckingPurchase(false);
    }
  }, [question]);

  // ===== Coupon Handlers =====
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    setIsCouponLoading(true);
    try {
      const result = await validateGift.mutateAsync({
        code: couponCode,
        total_amount: question?.price || 0,
        order_type: 'books', // یا 'all'
      });

      if (result.valid) {
        setAppliedGift(result.gift);
        setCouponDiscount(result.discount);
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

  // ===== Like Handler =====
  const handleLike = () => {
    if (!question) return;

    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));

    likeMutation.mutate(question.id, {
      onError: () => {
        setIsLiked(!newLiked);
        setLikesCount((prev) => (!newLiked ? prev + 1 : prev - 1));
      },
    });
  };

  // ===== Purchase & Download =====
  const handleDownload = async () => {
    if (!question) return;
    setDownloadError(null);

    // ✅ اگه قبلا خریداری شده، مستقیم دانلود کن
    if (isPurchased) {
      downloadMutation.mutate(question.id, {
        onError: (error: any) => {
          setDownloadError(error?.response?.data?.message || 'خطا در دانلود');
        },
      });
      return;
    }

    // ✅ اگه رایگانه، مستقیم دانلود کن
    if (question.price_type === 'free') {
      downloadMutation.mutate(question.id, {
        onError: (error: any) => {
          setDownloadError(error?.response?.data?.message || 'خطا در دانلود');
        },
      });
      return;
    }

    const finalPrice = question.price - couponDiscount;
    const confirmPurchase = window.confirm(
      `آیا از خرید سوال "${question.title}" به مبلغ ${numberFormat.format(finalPrice)} تومان اطمینان دارید؟`
    );

    if (!confirmPurchase) return;

    try {
      // 1️⃣ اعمال کد تخفیف
      if (appliedGift) {
        await applyGift.mutateAsync({
          code: appliedGift.code,
          total_amount: question.price,
          order_type: 'books',
          order_id: `Q-${questionId}-${Date.now()}`,
        });
      }

      // 2️⃣ درخواست خرید
      const purchaseResponse = await api.post(API_ENDPOINTS.QUESTION_BANK.PURCHASE(questionId));

      if (purchaseResponse.data.success) {
        setIsPurchased(true);
        alert('✅ خرید با موفقیت انجام شد!');
        await refetch();

        downloadMutation.mutate(question.id, {
          onError: (error: any) => {
            setDownloadError(error?.response?.data?.message || 'خطا در دانلود');
          },
        });
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'خطا در پرداخت';
      if (message.includes('موجودی') || message.includes('کافی')) {
        setDownloadError('موجودی کیف پول کافی نیست. لطفاً کیف پول خود را شارژ کنید.');
      } else {
        setDownloadError(message);
      }
    }
  };

  // ===== Loading =====
  if (isLoading || isCheckingPurchase) {
    return (
      <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/question-bank" className="btn btn-secondary rounded-[var(--radius)] p-2">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-black text-foreground">جزئیات سوال</h1>
        </div>
        <Card className="p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-foreground-muted">در حال بارگذاری...</p>
        </Card>
      </Container>
    );
  }

  // ===== Not Found =====
  if (error || !question) {
    return (
      <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/question-bank" className="btn btn-secondary rounded-[var(--radius)] p-2">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-black text-foreground">سوال پیدا نشد</h1>
        </div>
        <Card className="p-8 text-center">
          <p className="text-sm font-bold text-foreground-muted">سوالی با این شناسه وجود ندارد</p>
          <Link href="/question-bank" className="btn btn-primary mt-4">
            بازگشت به بانک سوالات
          </Link>
        </Card>
      </Container>
    );
  }

  // ===== Render =====
  const isFree = question.price_type === 'free';
  const showPrice = !isFree && !isPurchased;
  const finalPrice = question.price - couponDiscount;

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/question-bank" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-foreground">جزئیات سوال</h1>
      </div>

      <Card className="p-6">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {question.is_featured && (
            <span className="badge bg-primary/10 text-primary text-xs">⭐ ویژه</span>
          )}
          {isPurchased && (
            <span className="badge bg-emerald-100 text-emerald-700 text-xs flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              خریداری شده
            </span>
          )}
          {isFree && <span className="badge bg-emerald-100 text-emerald-700 text-xs">رایگان</span>}
          {showPrice && (
            <span className="badge bg-amber-100 text-amber-700 text-xs">
              {numberFormat.format(finalPrice)} تومان
            </span>
          )}
          <span className="badge bg-background-subtle text-foreground-muted text-xs">
            {question.category?.title || 'بدون دسته'}
          </span>
        </div>

        {/* Title & Info */}
        <h1 className="text-2xl font-black text-foreground mb-2">{question.title}</h1>
        <p className="text-sm text-foreground-muted flex items-center gap-2 flex-wrap">
          <User className="h-4 w-4" />
          {question.teacher || 'نامشخص'}
          <span className="h-1 w-1 rounded-full bg-border" />
          <Calendar className="h-4 w-4" />
          {new Date(question.created_at).toLocaleDateString('fa-IR')}
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="text-xs">توسط: {question.user_name || 'کاربر'}</span>
        </p>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {numberFormat.format(question.views)} بازدید
          </span>
          <span className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            {numberFormat.format(question.downloads)} دانلود
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="h-4 w-4" />
            {numberFormat.format(question.likes)} لایک
          </span>
        </div>

        {/* Description */}
        <div className="mt-4 p-4 rounded-[var(--radius)] bg-background-subtle">
          <p className="text-md text-foreground leading-7 wrap-anywhere text-justify">
            {question.description}
          </p>
        </div>

        {/* ===== کد تخفیف ===== */}
        {showPrice && (
          <div className="mt-4 p-4 rounded-[var(--radius)] bg-background-subtle border border-border">
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="کد تخفیف"
                className="input flex-1 h-10 text-sm"
                disabled={!!appliedGift}
              />
              {appliedGift ? (
                <button onClick={handleRemoveCoupon} className="btn btn-error h-10 px-3 text-sm">
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleApplyCoupon}
                  disabled={isCouponLoading || !couponCode.trim()}
                  className="btn btn-secondary h-10 px-4 text-sm"
                >
                  {isCouponLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Tag className="h-4 w-4" />
                  )}
                  اعمال
                </button>
              )}
            </div>
            {couponError && (
              <div className="mt-1 flex items-center gap-1 text-xs text-error">
                <AlertCircle className="h-3 w-3" />
                {couponError}
              </div>
            )}
            {appliedGift && (
              <div className="mt-1 flex items-center gap-1 text-xs text-success animate-in fade-in">
                <CheckCircle className="h-3 w-3" />
                کد تخفیف {appliedGift.code} اعمال شد
                {appliedGift.discount_type === 'percent'
                  ? ` (${appliedGift.discount_value}%)`
                  : ` (${numberFormat.format(appliedGift.discount_value)} تومان)`}
              </div>
            )}
          </div>
        )}

        {/* Download Error */}
        {downloadError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 leading-5">{downloadError}</span>
            {downloadError.includes('کیف پول') && (
              <button
                onClick={() => router.push('/panel/wallet')}
                className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-white font-medium hover:bg-amber-700 active:scale-95 transition"
              >
                شارژ کیف پول
              </button>
            )}
            <button
              onClick={() => setDownloadError(null)}
              className="shrink-0 rounded p-0.5 hover:bg-amber-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Price & Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isPurchased && (
              <span className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                قبلاً خریداری شده
              </span>
            )}
            {isFree && <span className="text-2xl font-black text-emerald-600">رایگان</span>}
            {showPrice && (
              <span className="text-2xl font-black text-primary">
                {numberFormat.format(finalPrice)} تومان
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`rounded-full p-2 transition-all hover:bg-background-subtle ${
                isLiked ? 'text-rose-500' : 'text-foreground-muted'
              } ${likeMutation.isPending ? 'opacity-50' : ''}`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-rose-500' : ''}`} />
              <span className="text-xs">{likesCount}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
              className="btn btn-primary rounded-[var(--radius)] px-6 py-2 text-sm flex items-center gap-2"
            >
              {downloadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isPurchased ? 'دانلود مجدد' : isFree ? 'دانلود رایگان' : 'خرید و دانلود'}
            </button>
          </div>
        </div>

        {question.is_downloaded && (
          <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
            ✅ شما قبلاً این فایل را دانلود کرده‌اید.
          </p>
        )}
      </Card>
    </Container>
  );
}
