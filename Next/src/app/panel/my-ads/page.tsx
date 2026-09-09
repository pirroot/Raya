'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Megaphone,
  Plus,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  User,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useMyProducts, useDeleteProduct } from '@/lib/market/useMarket';
import { ProductDetail } from '@/components/market/ProductDetail';
import type { Ad, MarketProduct } from '@/lib/market/types';
import { ProductDetail_Ad } from '@/components/market/ProductDetail_ad';

const statusLabels: Record<Ad['status'], { label: string; icon: any; color: string }> = {
  pending: {
    label: 'در انتظار تایید',
    icon: Clock,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  },
  approved: {
    label: 'فعال',
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  },
  expired: {
    label: 'منقضی',
    icon: XCircle,
    color: 'text-slate-500 bg-slate-50 dark:bg-slate-800/30',
  },
  rejected: {
    label: 'رد شده',
    icon: XCircle,
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30',
  },
  sold: {
    label: 'فروخته شده',
    icon: CheckCircle2,
    color:
      'text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800',
  },
};

const currencyFormatter = new Intl.NumberFormat('fa-IR');

export default function MyAdsPage() {
  const [filter, setFilter] = useState<'all' | Ad['status']>('all');
  const [selectedAd, setSelectedAd] = useState<MarketProduct | null>(null);
  const { data, isLoading, isError, refetch } = useMyProducts();
  const { mutate: deleteAd } = useDeleteProduct();

  const ads = data?.items || [];

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این آگهی مطمئن هستید؟')) {
      deleteAd(id, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const handleViewAd = (ad: Ad) => {
    setSelectedAd(ad as MarketProduct);
  };

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
        <p className="text-error">خطا در دریافت آگهی‌ها</p>
      </Container>
    );
  }

  const filteredAds = ads.filter((ad) => (filter === 'all' ? true : ad.status === filter));
  return (
    <>
      <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/panel" className="btn btn-secondary rounded-[var(--radius)] p-2">
              <ArrowRight className="h-4 w-4" />
            </Link>
            <h1 className="text-lg font-black text-foreground">آگهی‌های من</h1>
            <span className="badge bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
              {ads.length}
            </span>
          </div>
          <Link
            href="/market/create-ad"
            className="btn btn-primary rounded-[var(--radius)] px-3 py-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            جدید
          </Link>
        </div>

        {/* فیلترها */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-background-subtle text-foreground-muted hover:bg-background-subtle/80'
            }`}
          >
            همه ({ads.length})
          </button>
          {Object.entries(statusLabels).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setFilter(key as Ad['status'])}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                filter === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background-subtle text-foreground-muted hover:bg-background-subtle/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* لیست آگهی‌ها */}
        <div className="space-y-3">
          {filteredAds.length === 0 ? (
            <Card className="p-8 text-center">
              <Megaphone className="mx-auto h-10 w-10 text-foreground-muted/30" />
              <p className="mt-2 text-sm font-bold text-foreground-muted">آگهی‌ای ثبت نکردید</p>
              <Link
                href="/market/create-ad"
                className="mt-2 inline-block text-xs font-bold text-primary hover:text-primary-hover"
              >
                ثبت آگهی جدید
              </Link>
            </Card>
          ) : (
            filteredAds.map((ad) => {
              const StatusIcon = statusLabels[ad.status]?.icon || Clock;
              const statusColor =
                statusLabels[ad.status]?.color || 'text-slate-500 bg-slate-50 dark:bg-slate-800/30';
              const isSold = ad.status === 'sold' || ad.is_sold;
              const isPending = ad.status === 'pending';

              return (
                <Card key={ad.id} className="p-4 transition-all hover:shadow-[var(--shadow-lg)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate text-sm font-black text-foreground">{ad.title}</p>
                        <span
                          className={`inline-flex items-center gap-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${statusColor}`}
                        >
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusLabels[ad.status]?.label || ad.status}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-foreground-muted flex-wrap">
                        <span>{new Date(ad.created_at).toLocaleDateString('fa-IR')}</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>{ad.views} بازدید</span>
                        {ad.campus && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span>{ad.campus}</span>
                          </>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-foreground-muted">
                          {ad.category?.title || 'بدون دسته'}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-xs text-foreground-muted/60">{ad.condition}</span>
                      </div>

                      {/* ===== نمایش فروخته شده با رنگ قرمز ===== */}
                      {isSold && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full inline-flex border border-rose-200 dark:border-rose-800">
                          <User className="h-3 w-3" />
                          <span className="font-bold">✅ فروخته شده</span>
                          {ad.buyer_name && (
                            <span className="text-rose-600/70">توسط {ad.buyer_name}</span>
                          )}
                          {ad.buyer_phone && (
                            <a
                              href={`tel:${ad.buyer_phone}`}
                              className="text-primary hover:underline ml-1"
                            >
                              📞
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-primary">
                        {currencyFormatter.format(ad.price || ad.priceAmount || 0)}
                      </p>
                      <p className="text-[9px] text-foreground-muted">تومان</p>

                      <div className="mt-2 flex gap-1 justify-end">
                        {/* دکمه مشاهده - همیشه فعال */}
                        <button
                          onClick={() => handleViewAd(ad)}
                          className="rounded-full p-1.5 hover:bg-background-subtle transition-colors"
                          title="مشاهده آگهی"
                        >
                          <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                        </button>

                        {/* دکمه حذف - فقط برای آگهی‌های فروخته نشده و در انتظار تایید */}
                        {!isSold && isPending && (
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="rounded-full p-1.5 hover:bg-error/10 transition-colors"
                            title="حذف آگهی"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-error" />
                          </button>
                        )}

                        {/* اگه فروخته شده، دکمه حذف نداره */}
                        {isSold && (
                          <span className="text-[9px] text-rose-500 font-bold px-1">🔒</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Container>

      <ProductDetail_Ad
        product={selectedAd}
        onClose={() => setSelectedAd(null)}
        onAddToCart={() => {}}
      />
    </>
  );
}
