import Link from 'next/link';
import Image from 'next/image';
import { Brain, BookOpen } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ServiceGrid } from '@/components/home/ServiceGrid';
import { BannerSlider } from '@/components/ui/BannerSlider';
import api, { API_ENDPOINTS } from '@/lib/api';

// ===== Metadata =====
export const metadata = {
  title: 'رایا - پلتفرم جامع دانشجویی | آموزش، هوش مصنوعی و بازارچه',
  description:
    'رایا پلتفرم هوشمند برای دانشجویان. دسترسی به دوره‌های آموزشی، هوش مصنوعی، بازارچه خرید و فروش، تست‌های روانشناسی و ابزارهای دانشجویی',
  keywords: 'دانشجو, آموزش, هوش مصنوعی, بازارچه, دوره, تست روانشناسی, رایا',
  openGraph: {
    title: 'رایا - پلتفرم جامع دانشجویی',
    description: 'دسترسی به دوره‌های آموزشی، هوش مصنوعی، بازارچه خرید و فروش و ابزارهای دانشجویی',
    url: 'https://raya.ir',
    siteName: 'رایا',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'رایا - پلتفرم جامع دانشجویی',
    description: 'دسترسی به دوره‌های آموزشی، هوش مصنوعی، بازارچه خرید و فروش و ابزارهای دانشجویی',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://raya.ir',
  },
};

// ===== Fetch Banners =====
async function getBanners() {
  try {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/api/v1/banners/?placement=home_top`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data.items || data || [];
  } catch {
    return [];
  }
}

const PRIMARY_ACTIONS = [
  {
    title: 'هوش مصنوعی',
    eyebrow: 'دستیار هوشمند',
    href: '/ai',
    icon: Brain,
    gradient: 'from-blue-500 to-blue-600',
    description: 'مشاوره تحصیلی و پاسخ به سوالات',
  },
  {
    title: 'دوره ها',
    eyebrow: 'یادگیری',
    href: '/courses',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-emerald-600',
    description: 'دوره‌های تخصصی دانشگاهی',
  },
];

// ===== Page =====
export default async function HomePage() {
  const banners = await getBanners();

  return (
    <main>
      <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
        {/* ===== H1 برای SEO ===== */}
        <h1 className="sr-only">رایا - پلتفرم جامع دانشجویی</h1>

        {/* ===== Banners ===== */}
        <section aria-label="بنرهای تبلیغاتی">
          <BannerSlider banners={banners} />
        </section>

        {/* ===== Primary Actions ===== */}
        <section className="mt-3 lg:mt-4" aria-label="دسترسی سریع">
          <h2 className="sr-only">دسترسی سریع</h2>
          <div className="grid grid-cols-2 gap-2.5 lg:gap-3">
            {PRIMARY_ACTIONS.map(({ title, eyebrow, href, icon: Icon, gradient, description }) => (
              <Link
                key={title}
                href={href}
                className={`
                  group relative overflow-hidden rounded-[var(--radius)] px-3 py-3
                  shadow-[var(--shadow)] transition-all duration-200
                  hover:shadow-[var(--shadow-lg)] active:scale-[0.97]
                  lg:px-4 lg:py-4
                  bg-gradient-to-br ${gradient}
                `}
                aria-label={`${title} - ${description}`}
              >
                <div
                  className="absolute -right-8 -top-8 h-16 w-16 rotate-12 rounded-3xl bg-white/15"
                  aria-hidden="true"
                />
                <div className="relative flex min-h-[80px] flex-col justify-between lg:min-h-[100px]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-white/20 text-white transition-transform duration-200 group-active:scale-95 lg:h-10 lg:w-10">
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/70 lg:text-xs">{eyebrow}</p>
                    <p className="mt-0.5 text-base font-extrabold leading-5 text-white lg:text-lg">
                      {title}
                    </p>
                    <p className="hidden text-[9px] text-white/50 lg:block">{description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== Services ===== */}
        <section aria-label="خدمات رایا">
          <h2 className="sr-only">خدمات رایا</h2>
          <ServiceGrid />
        </section>
      </Container>
    </main>
  );
}
