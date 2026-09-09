'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, Wallet, Coins, CheckCircle, Tag, X, AlertCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';
import { isAuthError } from '@/lib/api-error';
import { useValidateGift, useApplyGift } from '@/lib/api/hooks/useGifts';

const currencyFormatter = new Intl.NumberFormat('fa-IR');

export default function PurchaseTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'coin'>('wallet');

  // ===== Coupon States =====
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedGift, setAppliedGift] = useState<any>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);

  const validateGift = useValidateGift();
  const applyGift = useApplyGift();

  // ===== Load Test =====
  useEffect(() => {
    const loadTest = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.PSYCHOLOGY_TESTS.DETAIL(testId));
        setTest(response.data);
      } catch (error) {
        if (isAuthError(error)) {
          router.replace('/auth/mobile');
          return;
        }
        console.error('Error loading test:', error);
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      loadTest();
    }
  }, [testId, router]);

  // ===== Coupon Handlers =====
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !test) return;
    setCouponError(null);
    setIsCouponLoading(true);
    try {
      const result = await validateGift.mutateAsync({
        code: couponCode,
        total_amount: test.price || 0,
        order_type: 'all',
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

  // ===== Purchase =====
  const handlePurchase = async () => {
    if (!test) return;

    setPurchasing(true);
    try {
      // اعمال کد تخفیف
      if (appliedGift && test.price > 0) {
        await applyGift.mutateAsync({
          code: appliedGift.code,
          total_amount: test.price,
          order_type: 'all',
          order_id: `TEST-${testId}-${Date.now()}`,
        });
      }

      await api.post(API_ENDPOINTS.PSYCHOLOGY_TESTS.PURCHASE(testId), {
        payment_method: paymentMethod,
        coupon_code: appliedGift?.code || '',
        coupon_discount: couponDiscount,
      });
      router.push(`/psychology-test/${testId}`);
    } catch (error) {
      console.error('Error purchasing test:', error);
      alert('خطا در خرید تست');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Container>
    );
  }

  if (!test) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center">
        <p className="text-lg font-bold text-foreground-muted">تست یافت نشد</p>
        <Link href="/psychology-test" className="btn btn-primary mt-4">
          بازگشت به لیست تست‌ها
        </Link>
      </Container>
    );
  }

  const finalPrice = Math.max(0, (test.price || 0) - couponDiscount);

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/psychology-test" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-foreground">خرید تست</h1>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-3xl">
            🧠
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">{test.title}</h2>
            <p className="text-sm text-foreground-muted">{test.description}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-[var(--radius)] bg-background-subtle p-3 text-sm">
          <div>
            <p className="text-foreground-muted">تعداد سوالات</p>
            <p className="font-black text-foreground">{test.questions_count}</p>
          </div>
          <div>
            <p className="text-foreground-muted">زمان</p>
            <p className="font-black text-foreground">{test.duration} دقیقه</p>
          </div>
        </div>

        {/* ===== کد تخفیف ===== */}
        {test.price > 0 && (
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
                  : ` (${currencyFormatter.format(appliedGift.discount_value)} تومان)`}
              </div>
            )}
          </div>
        )}

        {/* Payment Methods */}
        <div className="mt-4 space-y-3">
          <p className="text-sm font-black text-foreground">روش پرداخت</p>

          {test.price > 0 && (
            <button
              onClick={() => setPaymentMethod('wallet')}
              className={`flex w-full items-center justify-between rounded-[var(--radius)] border-2 p-4 transition-all ${
                paymentMethod === 'wallet'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-foreground">کیف پول</span>
              </div>
              <span className="text-sm font-black text-primary">
                {currencyFormatter.format(finalPrice)} تومان
              </span>
            </button>
          )}

          {test.coin_price > 0 && (
            <button
              onClick={() => setPaymentMethod('coin')}
              className={`flex w-full items-center justify-between rounded-[var(--radius)] border-2 p-4 transition-all ${
                paymentMethod === 'coin'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-bold text-foreground">سکه</span>
              </div>
              <span className="text-sm font-black text-amber-500">{test.coin_price} سکه</span>
            </button>
          )}
        </div>

        {couponDiscount > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-[var(--radius)] bg-success/10 p-2 text-sm">
            <span className="text-success">تخفیف اعمال شده</span>
            <span className="font-black text-success">
              -{currencyFormatter.format(couponDiscount)} تومان
            </span>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className="btn btn-primary mt-6 w-full"
        >
          {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'خرید و شروع تست'}
        </button>
      </Card>
    </Container>
  );
}
