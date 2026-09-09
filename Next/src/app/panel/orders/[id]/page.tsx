'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Phone,
  MessageSquare,
  ShoppingBag,
  MapPin,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useOrderDetail } from '@/lib/market/useMarket';

const statusLabels: Record<string, { label: string; icon: any; color: string }> = {
  pending: {
    label: 'در انتظار پرداخت',
    icon: Clock,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  },
  paid: {
    label: 'پرداخت شده',
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  },
  processing: {
    label: 'در حال پردازش',
    icon: Package,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  },
  delivered: {
    label: 'تحویل شده',
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  },
  cancelled: {
    label: 'لغو شده',
    icon: XCircle,
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30',
  },
};

const currencyFormatter = new Intl.NumberFormat('fa-IR');

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: order, isLoading, isError } = useOrderDetail(orderId);

  if (isLoading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  if (isError || !order) {
    return (
      <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/panel/orders" className="btn btn-secondary rounded-[var(--radius)] p-2">
            <ArrowRight className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-black text-foreground">سفارش پیدا نشد</h1>
        </div>
        <Card className="p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-foreground-muted/30" />
          <p className="mt-2 text-sm font-bold text-foreground-muted">
            سفارشی با این شناسه وجود ندارد
          </p>
        </Card>
      </Container>
    );
  }

  // ===== گرفتن اطلاعات از آیتم اول =====
  const firstItem = order.items?.[0];
  const sellerName = firstItem?.seller_name || 'فروشنده';
  const sellerPhone = firstItem?.seller_phone || '';
  const sellerCampus = firstItem?.campus || '';
  const sellerLocation = firstItem?.location || '';

  const totalPrice = order.total_price ?? order.totalPrice ?? 0;
  const finalPrice = order.final_price ?? order.finalPrice ?? totalPrice;
  const paidAt = order.paid_at ?? order.paidAt ?? null;

  const StatusIcon = statusLabels[order.status]?.icon || Package;
  const statusColor =
    statusLabels[order.status]?.color || 'text-slate-500 bg-slate-50 dark:bg-slate-800/30';
  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/panel/orders" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-black text-foreground">جزئیات سفارش</h1>
        <span className="text-xs text-foreground-muted mr-auto">#{order.order_number}</span>
      </div>

      {/* ===== اطلاعات فروشنده ===== */}
      <Card className="p-4 border-r-4 border-r-primary bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-foreground">{sellerName}</p>
            <p className="text-xs text-foreground-muted">فروشنده</p>
          </div>
          {sellerPhone && (
            <a
              href={`tel:${sellerPhone}`}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 transition-all"
            >
              <Phone className="h-3.5 w-3.5" />
              تماس
            </a>
          )}
        </div>
        {(sellerCampus || sellerLocation) && (
          <div className="mt-2 flex items-center gap-1 text-xs text-foreground-muted border-t border-border pt-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {sellerCampus}
              {sellerCampus && sellerLocation && ' - '}
              {sellerLocation}
            </span>
          </div>
        )}
      </Card>

      {/* ===== وضعیت ===== */}
      <Card className="mt-3 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${statusColor}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {statusLabels[order.status]?.label || order.status}
          </span>
          {paidAt && (
            <span className="text-xs text-foreground-muted bg-background-subtle px-2 py-0.5 rounded-full">
              {formatDate(paidAt)}
            </span>
          )}
        </div>
      </Card>

      {/* ===== محصول ===== */}
      <Card className="mt-3 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="h-4 w-4 text-foreground-muted" />
          <h2 className="text-sm font-black text-foreground">محصولات</h2>
        </div>
        {order.items?.map((item, index) => {
          const title = item.ad_title || item.ad?.title || item.product?.title || 'محصول';
          const price = item.price_at_time ?? item.priceAtTime ?? 0;

          return (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-foreground">{title}</p>
                <p className="text-xs text-foreground-muted">تعداد: {item.quantity}</p>
              </div>
              <p className="text-sm font-black text-foreground">
                {currencyFormatter.format(price)}
              </p>
            </div>
          );
        })}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-bold text-foreground-muted">مبلغ نهایی</span>
          <span className="text-lg font-black text-primary">
            {currencyFormatter.format(finalPrice)}
          </span>
        </div>
      </Card>

      {/* ===== اطلاعات اضافی ===== */}
      {(order.payment_method || order.coupon_code) && (
        <Card className="mt-3 p-4">
          <h2 className="text-sm font-black text-foreground mb-3">اطلاعات سفارش</h2>
          <div className="space-y-2 text-sm">
            {order.payment_method && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-foreground-muted" />
                <span className="text-foreground-muted">روش پرداخت:</span>
                <span className="font-medium text-foreground">
                  {order.payment_method === 'wallet' ? 'کیف پول' : 'درگاه بانکی'}
                </span>
              </div>
            )}
            {order.coupon_code && (
              <div className="flex items-center gap-2">
                <span className="text-foreground-muted">🎫</span>
                <span className="text-foreground-muted">کد تخفیف:</span>
                <span className="font-medium text-success">{order.coupon_code}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-foreground-muted" />
              <span className="text-foreground-muted">تاریخ ثبت:</span>
              <span className="font-medium text-foreground">{formatDate(order.created_at)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* ===== دکمه چت ===== */}
      <Link
        href={`/panel/chats`}
        className="mt-3 btn btn-primary w-full text-sm flex items-center justify-center gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        پیگیری در چت
      </Link>
    </Container>
  );
}
