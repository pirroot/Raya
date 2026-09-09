'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { resolveImageUrl } from '@/lib/api';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  order: number;
}

interface BannerSliderProps {
  banners: Banner[];
  autoPlay?: boolean;
  interval?: number;
}

export function BannerSlider({ banners, autoPlay = true, interval = 5000 }: BannerSliderProps) {
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

  const validBanners = banners.filter((b) => b.image_url);

  if (validBanners.length === 0) {
    return (
      <div className="relative flex h-48 w-full items-center justify-center rounded-xl bg-background-subtle sm:h-56 lg:h-64">
        <p className="text-sm text-foreground-muted">هیچ بنری موجود نیست</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        centeredSlides={true}
        autoplay={
          autoPlay
            ? {
                delay: interval,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-white/50 !opacity-100',
          bulletActiveClass: '!bg-white !w-6',
          renderBullet: (index, className) => {
            return `<button class="${className} !h-1.5 !rounded-full !transition-all !duration-300" aria-label="اسلاید ${index + 1}"></button>`;
          },
        }}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        loop={validBanners.length > 1}
        className="h-48 sm:h-56 lg:h-64"
      >
        {validBanners.map((banner) => {
          const imageUrl = resolveImageUrl(banner.image_url);
          const isExternal = banner.link_url?.startsWith('http');
          const isLoaded = imagesLoaded[banner.id];

          const content = (
            <div className="relative h-48 w-full sm:h-56 lg:h-64">
              {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-background-subtle animate-pulse">
                  <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                </div>
              )}
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={banner.title || 'بنر'}
                  fill
                  className={`object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                  priority={validBanners.indexOf(banner) === 0}
                  unoptimized
                  onLoad={() => {
                    setImagesLoaded((prev) => ({ ...prev, [banner.id]: true }));
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    setImagesLoaded((prev) => ({ ...prev, [banner.id]: true }));
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-right">
                <h3 className="text-lg font-bold text-white drop-shadow-lg">{banner.title}</h3>
                {banner.subtitle && (
                  <p className="text-sm text-white/80 drop-shadow-lg">{banner.subtitle}</p>
                )}
              </div>
            </div>
          );

          if (banner.link_url) {
            return (
              <SwiperSlide key={banner.id}>
                <Link
                  href={banner.link_url}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="block"
                >
                  {content}
                </Link>
              </SwiperSlide>
            );
          }

          return <SwiperSlide key={banner.id}>{content}</SwiperSlide>;
        })}
      </Swiper>

      {/* Custom Navigation */}
      {validBanners.length > 1 && (
        <>
          <button
            className="swiper-button-prev-custom absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50 disabled:opacity-50"
            aria-label="اسلاید قبلی"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            className="swiper-button-next-custom absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50 disabled:opacity-50"
            aria-label="اسلاید بعدی"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
