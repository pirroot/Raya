'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useOrders } from '@/lib/market/useMarket';

interface OrderItem {
  id: string;
  ad: {
    id: string;
    title: string;
  };
  quantity: number;
  price_at_time: number;
}

interface Order {
  id: string;
  order_number: string;
  total_price: number;
  final_price: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_method: 'wallet' | 'bank';
  items: OrderItem[];
  created_at: string;
  paid_at?: string;
  delivered_at?: string;
}

const statusLabels: Record<Order['status'], { label: string; icon: any; color: string }> = {
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
  shipped: {
    label: 'ارسال شده',
    icon: Truck,
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
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
  refunded: {
    label: 'برگشت خورده',
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

function getStatusBorder(status: Order['status']): string {
  const map: Record<Order['status'], string> = {
    pending: 'border-amber-200',
    paid: 'border-emerald-200',
    processing: 'border-blue-200',
    shipped: 'border-indigo-200',
    delivered: 'border-emerald-200',
    cancelled: 'border-rose-200',
    refunded: 'border-rose-200',
  };
  return map[status] || 'border-border';
}

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | Order['status']>('all');
  const { data, isLoading, isError } = useOrders(activeFilter === 'all' ? undefined : activeFilter);

  const orders = data?.items || [];

  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<Order['status'], number>
  );

  if (isLoading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="py-8 text-center">
        <p className="text-error">خطا در دریافت سفارش‌ها</p>
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/panel" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-black text-foreground">سفارش‌های من</h1>
        <span className="badge bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
          {orders.length}
        </span>
      </div>

      {/* فیلترها */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveFilter('all')}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
            activeFilter === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-background-subtle text-foreground-muted hover:bg-background-subtle/80'
          }`}
        >
          همه ({orders.length})
        </button>
        {Object.entries(statusLabels).map(([key, { label }]) => {
          const count = statusCounts[key as Order['status']] || 0;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key as Order['status'])}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                activeFilter === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background-subtle text-foreground-muted hover:bg-background-subtle/80'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* لیست سفارش‌ها */}
      <div className="mt-3 space-y-2.5">
        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="mx-auto h-10 w-10 text-foreground-muted/30" />
            <p className="mt-2 text-sm font-bold text-foreground-muted">سفارشی پیدا نشد</p>
            <p className="text-xs text-foreground-muted/60">
              سفارش‌های شما اینجا نمایش داده می‌شود
            </p>
            <Link href="/market" className="btn btn-primary mt-4 text-sm">
              <ShoppingBag className="h-4 w-4" />
              شروع خرید
            </Link>
          </Card>
        ) : (
          orders.map((order) => {
            const StatusIcon = statusLabels[order.status]?.icon || Package;
            const statusColor =
              statusLabels[order.status]?.color ||
              'text-slate-500 bg-slate-50 dark:bg-slate-800/30';

            // گرفتن عنوان محصول اول
            const firstItemTitle = order.items?.[0]?.ad?.title || 'محصول';

            return (
              <Card
                key={order.id}
                className={`p-3 transition-all hover:shadow-[var(--shadow-lg)] border-r-4 ${getStatusBorder(order.status)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate text-sm font-black text-foreground">
                        {firstItemTitle}
                      </p>
                      <span
                        className={`inline-flex items-center gap-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${statusColor}`}
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        {statusLabels[order.status]?.label || order.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-foreground-muted mt-0.5">
                      #{order.order_number}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-foreground-muted">
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-primary">
                      {currencyFormatter.format(order.final_price || order.total_price)}
                    </p>
                    <p className="text-[9px] text-foreground-muted">تومان</p>
                    <Link
                      href={`/panel/orders/${order.id}`}
                      className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-primary hover:text-primary-hover transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      جزئیات
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Container>
  );
}
