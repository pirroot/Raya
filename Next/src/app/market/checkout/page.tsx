'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Wallet,
  Tag,
  X,
  AlertCircle,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/button';
import api, { API_ENDPOINTS } from '@/lib/api';
import { useCart, useCreateOrder, useProductDetail, useClearCart } from '@/lib/market/useMarket';
import { useWalletBalance } from '@/lib/api/hooks/useWallet';
import { useValidateGift, useApplyGift } from '@/lib/api/hooks/useGifts';

type PaymentMethod = 'wallet';

const currencyFormatter = new Intl.NumberFormat('fa-IR');

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedGift, setAppliedGift] = useState<any>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);

  const { data: cart, isLoading: cartLoading, refetch: refetchCart } = useCart();
  const { data: walletBalance, refetch: refetchBalance } = useWalletBalance();
  const {
    data: singleProduct,
    isLoading: productLoading,
    isError: productError,
  } = useProductDetail(productId && !productId.includes(',') ? productId : '');
  const clearCart = useClearCart();

  const createOrder = useCreateOrder();
  const validateGift = useValidateGift();
  const applyGift = useApplyGift();

  const isSingleProduct = productId && !productId.includes(',');
  const hasCartItems = cart?.items && cart.items.length > 0;

  const cartItems = hasCartItems
    ? cart.items
    : isSingleProduct && singleProduct
      ? [
          {
            id: singleProduct.id,
            ad: singleProduct,
            product: singleProduct,
            quantity: 1,
            subtotal: singleProduct.price,
          },
        ]
      : [];

  const totalPrice = hasCartItems
    ? cart.totalPrice
    : isSingleProduct && singleProduct
      ? singleProduct.price
      : 0;

  const finalPrice = totalPrice - couponDiscount;
  const itemCount = hasCartItems ? cart.itemCount : isSingleProduct && singleProduct ? 1 : 0;

  useEffect(() => {
    if (productError && isSingleProduct) {
      setError('محصول مورد نظر یافت نشد');
    }
  }, [productError, isSingleProduct]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    setIsCouponLoading(true);
    try {
      const result = await validateGift.mutateAsync({
        code: couponCode,
        total_amount: totalPrice,
        order_type: 'market',
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

  const handlePayment = async () => {
    if (cartItems.length === 0) {
      setError('سبد خرید شما خالی است');
      return;
    }

    if ((walletBalance || 0) < finalPrice) {
      setError('موجودی کیف پول شما کافی نیست');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (isSingleProduct && singleProduct && !hasCartItems) {
        await api.post(API_ENDPOINTS.MARKET.CART_ADD, {
          ad_id: productId,
          quantity: 1,
        });
        await refetchCart();
      }

      // اعمال کد تخفیف قبل از ایجاد سفارش
      let finalCouponCode = appliedGift?.code || '';
      if (appliedGift) {
        await applyGift.mutateAsync({
          code: appliedGift.code,
          total_amount: totalPrice,
          order_type: 'market',
          order_id: `ORDER-${Date.now()}`,
        });
      }

      const order = await createOrder.mutateAsync({
        address: 'آدرس تست',
        paymentMethod: 'wallet',
        couponCode: finalCouponCode,
        shippingCost: 0,
      });

      await clearCart.mutateAsync();

      await refetchBalance();
      await refetchCart();
      router.push(`/market/order-success?orderId=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در پرداخت');

      if (err instanceof Error && err.message.includes('کافی نیست')) {
        await clearCart.mutateAsync();
        await refetchCart();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = cartLoading || (isSingleProduct && productLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen">
        <Container className="pb-10 pt-4 lg:pb-16 lg:pt-8">
          <div className="card p-12 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <ShoppingBag className="h-12 w-12 text-primary/50" />
              </div>
            </div>
            <h2 className="mt-4 text-xl font-black">سبد خرید خالی است</h2>
            <p className="mt-2 text-sm text-foreground-muted">
              {productId && productId.includes(',')
                ? 'لطفاً محصولات را به سبد خرید اضافه کنید'
                : 'کالایی به سبد خرید اضافه کنید'}
            </p>
            <Link href="/market" className="btn btn-primary mt-6">
              بازگشت به بازارچه
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-subtle">
      <Container className="pb-10 pt-4 lg:pb-16 lg:pt-8">
        <section className="flex items-center justify-between mb-5">
          <Link
            href="/market"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-[var(--shadow)] hover:scale-105 transition-all active:scale-95"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-black">تکمیل خرید</h1>
          <div className="h-11 w-11" />
        </section>

        <section className="card overflow-hidden bg-linear-to-br from-primary/90 via-primary to-secondary/50 p-5 text-white shadow-[var(--shadow-xl)]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/70">تعداد کالاها</p>
              <h2 className="mt-0.5 text-xl font-black leading-8">{itemCount} کالا</h2>
              <p className="mt-0.5 text-sm font-medium text-white/65 line-clamp-1">
                {cartItems.map((item) => item.ad?.title || item.product?.title).join('، ')}
              </p>
            </div>
          </div>
        </section>

        <section className="card mt-4 p-4">
          <h2 className="text-sm font-black">روش پرداخت</h2>
          <div className="mt-3">
            <div className="flex cursor-pointer items-center gap-3 rounded-xl bg-primary-soft p-3 ring-2 ring-primary">
              <Wallet className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <span className="text-sm font-black text-primary-text">کیف پول رایا</span>
                {walletBalance !== undefined && (
                  <span className="mr-2 text-xs font-normal text-foreground-muted">
                    (موجودی: {currencyFormatter.format(walletBalance)} تومان)
                  </span>
                )}
              </div>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
          </div>
        </section>

        <section className="card mt-4 p-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm font-bold text-foreground-muted">
              <span>قیمت کالاها ({itemCount} عدد)</span>
              <span>{currencyFormatter.format(totalPrice)} تومان</span>
            </div>

            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs text-foreground-muted/70 pr-4"
              >
                <span>
                  {item.ad?.title || item.product?.title} × {item.quantity}
                </span>
                <span>
                  {currencyFormatter.format(
                    (item.ad?.price || item.product?.price || 0) * item.quantity
                  )}{' '}
                  تومان
                </span>
              </div>
            ))}

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between text-sm font-bold text-foreground-muted">
              <span>هزینه ارسال</span>
              <span className="text-success">رایگان</span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-sm font-bold text-success">
                <span>تخفیف</span>
                <span>-{currencyFormatter.format(couponDiscount)} تومان</span>
              </div>
            )}

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between text-base font-black">
              <span>مبلغ نهایی</span>
              <span className="text-primary">{currencyFormatter.format(finalPrice)} تومان</span>
            </div>
          </div>
        </section>

        <section className="card mt-4 p-4">
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
              <CheckCircle2 className="h-3 w-3" />
              کد تخفیف {appliedGift.code} اعمال شد
              {appliedGift.discount_type === 'percent'
                ? ` (${appliedGift.discount_value}%)`
                : ` (${currencyFormatter.format(appliedGift.discount_value)} تومان)`}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-xl bg-primary-soft p-4 text-primary-text ring-1 ring-primary/10">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-6">
              اطلاعات شما با بالاترین سطح امنیت محافظت می‌شود.
            </p>
          </div>
        </section>

        {error && (
          <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm font-black text-error ring-1 ring-error/20 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handlePayment}
          disabled={isProcessing || cartItems.length === 0}
          className="mt-4 rounded-xl text-sm h-14 font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال پردازش...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              پرداخت {currencyFormatter.format(finalPrice)} تومان
            </>
          )}
        </Button>
      </Container>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
