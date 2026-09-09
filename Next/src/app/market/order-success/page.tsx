'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, ArrowRight, Calendar, CreditCard } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useOrderDetail } from '@/lib/market/useMarket';

const currencyFormatter = new Intl.NumberFormat('fa-IR');

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data: order, isLoading, isError } = useOrderDetail(orderId || '');

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <Container className="py-8 text-center">
        <p className="text-error">خطا در دریافت اطلاعات سفارش</p>
        <Link href="/market" className="btn btn-primary mt-4">
          بازگشت به بازارچه
        </Link>
      </Container>
    );
  }

  return (
    <main className="min-h-screen bg-background-subtle">
      <Container className="py-8">
        <Card className="mx-auto max-w-md p-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-success/10 p-4">
              <CheckCircle2 className="h-16 w-16 text-success" />
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-black text-foreground">✅ پرداخت موفق</h1>
          <p className="mt-1 text-sm text-foreground-muted">سفارش شما با موفقیت ثبت شد</p>

          <div className="mt-6 rounded-xl bg-background-subtle p-4 text-right">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">شماره سفارش</span>
                <span className="font-bold text-foreground">{order.order_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">تاریخ</span>
                <span className="font-bold text-foreground">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">مبلغ</span>
                <span className="font-bold text-primary">
                  {currencyFormatter.format(order.final_price)} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">روش پرداخت</span>
                <span className="font-bold text-foreground">
                  {order.payment_method === 'wallet' ? 'کیف پول' : 'درگاه بانکی'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Link href={`/panel/orders/${order.id}`} className="btn btn-primary w-full text-sm">
              <Package className="h-4 w-4" />
              مشاهده جزئیات سفارش
            </Link>
            <Link href="/market" className="btn btn-secondary w-full text-sm">
              <ArrowRight className="h-4 w-4" />
              بازگشت به بازارچه
            </Link>
          </div>
        </Card>
      </Container>
    </main>
  );
}
