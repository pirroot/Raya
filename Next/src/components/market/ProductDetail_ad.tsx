'use client';

import {
  MapPin,
  UserRound,
  X,
  Calendar,
  Eye,
  Heart,
  Share2,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
} from 'lucide-react';
import type { MarketProduct } from '@/lib/market/types';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const currencyFormatter = new Intl.NumberFormat('fa-IR');

type ProductDetailProps = {
  product: MarketProduct | null;
  onClose: () => void;
  onAddToCart?: (product: MarketProduct) => void;
};

const conditionLabels: Record<string, { label: string; color: string }> = {
  new: {
    label: 'نو',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  like_new: {
    label: 'در حد نو',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  used: {
    label: 'کارکرده',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  needs_repair: {
    label: 'نیازمند تعمیر',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
};

const statusLabels: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: {
    label: 'در انتظار تایید',
    icon: <Clock className="h-3 w-3" />,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  approved: {
    label: 'تایید شده',
    icon: <CheckCircle className="h-3 w-3" />,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  rejected: {
    label: 'رد شده',
    icon: <AlertCircle className="h-3 w-3" />,
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
  expired: {
    label: 'منقضی',
    icon: <AlertCircle className="h-3 w-3" />,
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  },
  sold: {
    label: 'فروخته شده',
    icon: <CheckCircle className="h-3 w-3" />,
    className:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
  },
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('fa-IR', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ProductDetail_Ad({ product, onClose, onAddToCart }: ProductDetailProps) {
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsImageLoading(true);
  }, [product]);

  if (!product) return null;

  let images: any[] = [];

  if (product.images?.length > 0) {
    images = product.images;
  } else if (product.image_url) {
    images = [{ id: '1', url: product.image_url, isPrimary: true, order: 0 }];
  } else if (product.image) {
    images = [{ id: '1', url: product.image, isPrimary: true, order: 0 }];
  }

  const hasMultipleImages = images.length > 1;
  const statusInfo = statusLabels[product.status] || statusLabels.pending;
  const conditionInfo = conditionLabels[product.condition] || conditionLabels.used;
  const isSold = product.status === 'sold' || product.is_sold;

  const sellerName = product.seller_name || product.seller_name || 'فروشنده';
  const sellerPhone = product.seller_phone || product.seller_phone || '';
  const sellerAvatar = product.seller_avatar || product.seller_avatar || null;
  const buyerName = product.buyer_name || '';
  const buyerPhone = product.buyer_phone || '';

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      });
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {}
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 py-4 backdrop-blur-sm lg:items-center"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card shadow-2xl lg:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Gallery */}
        <div className="relative h-56 bg-linear-to-br from-primary/80 via-primary to-secondary/50 lg:h-64">
          {images.length > 0 ? (
            <PhotoProvider>
              <Swiper
                modules={[Pagination, Navigation, Autoplay]}
                spaceBetween={0}
                slidesPerView={1}
                pagination={{
                  clickable: true,
                  bulletClass: 'swiper-pagination-bullet !bg-white/50 !opacity-100',
                  bulletActiveClass: '!bg-white !w-6',
                  renderBullet: (index, className) => {
                    return `<button class="${className} !h-1.5 !rounded-full !transition-all !duration-300" aria-label="تصویر ${index + 1}"></button>`;
                  },
                }}
                navigation={{
                  nextEl: '.swiper-button-next-custom',
                  prevEl: '.swiper-button-prev-custom',
                }}
                autoplay={hasMultipleImages ? { delay: 4000, disableOnInteraction: false } : false}
                loop={hasMultipleImages}
                className="h-full w-full"
                onSlideChange={() => setIsImageLoading(true)}
              >
                {images.map((image, index) => (
                  <SwiperSlide key={image.id || index}>
                    <PhotoView src={image.url}>
                      <div className="relative h-full w-full cursor-zoom-in">
                        <Image
                          src={image.url}
                          alt={image.alt || product.title}
                          fill
                          className="object-cover transition-opacity duration-300"
                          priority={index === 0}
                          unoptimized={true}
                          onLoadingComplete={() => setIsImageLoading(false)}
                          onError={() => setIsImageLoading(false)}
                        />
                      </div>
                    </PhotoView>
                  </SwiperSlide>
                ))}
              </Swiper>
            </PhotoProvider>
          ) : (
            <div className="flex h-full items-center justify-center text-7xl">🛍️</div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 active:scale-95"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
            <span
              className={`badge ${statusInfo.className} flex items-center gap-1 text-[10px] font-medium`}
            >
              {statusInfo.icon}
              {statusInfo.label}
            </span>
            <span className={`badge ${conditionInfo.color} text-[10px] font-medium`}>
              {conditionInfo.label}
            </span>
            {isSold && (
              <span className="badge bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-medium">
                ✅ فروخته شده
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-primary-text">
                {product.category?.title ?? 'بازار دانشجویی'}
              </p>
              <h2 className="mt-2 text-xl font-black leading-7 text-foreground">{product.title}</h2>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="rounded-full p-2 transition hover:bg-background-subtle active:scale-90"
              >
                <Heart
                  className={`h-4 w-4 transition ${
                    isLiked ? 'fill-rose-500 text-rose-500' : 'text-foreground-muted'
                  }`}
                />
              </button>
              <button
                onClick={handleShare}
                className="rounded-full p-2 transition hover:bg-background-subtle active:scale-90"
              >
                <Share2 className="h-4 w-4 text-foreground-muted" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">
              {currencyFormatter.format(product.price || product.priceAmount || 0)}
            </span>
            <span className="text-xs font-medium text-foreground-muted">تومان</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-foreground-muted">
            {product.views !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {product.views} بازدید
              </span>
            )}
            {product.campus && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {product.campus}
              </span>
            )}
            {product.location && (
              <span className="flex items-center gap-1 text-foreground-muted/60">
                {product.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(product.created_at || product.createdAt)}
            </span>
          </div>

          <div className="mt-4 rounded-lg bg-background-subtle p-4">
            <p className="text-sm leading-7 text-foreground-muted whitespace-pre-wrap break-words text-center">
              {product.description || 'توضیحاتی برای این آگهی ثبت نشده است.'}
            </p>
          </div>

          {/* ===== فروشنده ===== */}
          <div className="mt-4 rounded-lg border border-border p-4">
            <p className="text-[10px] font-bold text-foreground-muted mb-2">👤 فروشنده</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                {sellerAvatar ? (
                  <Image
                    src={sellerAvatar}
                    alt={sellerName}
                    width={40}
                    height={40}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <UserRound className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-foreground">{sellerName}</p>
                {sellerPhone && (
                  <a
                    href={`tel:${sellerPhone}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {sellerPhone}
                  </a>
                )}
              </div>
            </div>
            {(product.campus || product.location) && (
              <div className="mt-2 flex items-center gap-1 text-xs text-foreground-muted border-t border-border pt-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {product.campus}
                  {product.campus && product.location && ' - '}
                  {product.location}
                </span>
              </div>
            )}
          </div>

          {/* ===== خریدار (اگر فروخته شده) ===== */}
          {isSold && (buyerName || buyerPhone) && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-800 p-4">
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-2">
                ✅ خریدار
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-foreground">{buyerName || 'کاربر'}</p>
                  {buyerPhone && (
                    <a
                      href={`tel:${buyerPhone}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {buyerPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
