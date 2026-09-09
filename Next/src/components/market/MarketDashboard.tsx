'use client';

import { Container } from '@/components/ui/Container';
import type { MarketCategory, MarketProduct } from '@/lib/market/types';
import { Clock, Filter, MapPin, Plus, ShieldCheck, ShoppingCart, X, Zap, User } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '../ui/input';
import { CartDrawer } from './CartDrawer';
import { ProductDetail } from './ProductDetail';
import Link from 'next/link';
import { useMarketProducts, useAddToCart } from '@/lib/market/useMarket';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  images?: Array<{ url: string }>;
  maxQuantity?: number;
}

interface MarketDashboardProps {
  initialProducts: MarketProduct[];
  categories: MarketCategory[];
}

const currencyFormatter = new Intl.NumberFormat('fa-IR');

const CONDITION_OPTIONS = [
  { value: 'all', label: 'همه' },
  { value: 'new', label: 'نو' },
  { value: 'like_new', label: 'در حد نو' },
  { value: 'used', label: 'کارکرده' },
  { value: 'needs_repair', label: 'نیازمند تعمیر' },
];

function getConditionLabel(condition: string): string {
  const map: Record<string, string> = {
    new: 'نو',
    like_new: 'در حد نو',
    used: 'کارکرده',
    needs_repair: 'نیازمند تعمیر',
  };
  return map[condition] || condition;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'همین الان';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`;
  return date.toLocaleDateString('fa-IR');
}

function ProductSkeleton() {
  return (
    <div className="card flex gap-3 p-3 animate-pulse">
      <div className="h-20 w-20 shrink-0 rounded-[var(--radius)] bg-background-subtle" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 rounded bg-background-subtle" />
        <div className="h-3 w-1/2 rounded bg-background-subtle" />
        <div className="h-3 w-2/3 rounded bg-background-subtle" />
        <div className="flex justify-between">
          <div className="h-4 w-16 rounded bg-background-subtle" />
          <div className="h-4 w-20 rounded bg-background-subtle" />
        </div>
      </div>
    </div>
  );
}

export function MarketDashboard({ initialProducts, categories }: MarketDashboardProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<MarketProduct | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCondition, setFilterCondition] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: products, isLoading } = useMarketProducts({
    page,
    limit: 20,
    search: query || undefined,
    categoryId: activeCategory === 'all' ? undefined : activeCategory,
    condition: filterCondition === 'all' ? undefined : filterCondition,
    sortBy: sortBy,
  });

  const { mutate: addToCartApi } = useAddToCart();

  const productList = Array.isArray(products?.items)
    ? products.items
    : Array.isArray(products)
      ? products
      : Array.isArray(initialProducts)
        ? initialProducts
        : [];

  // ===== فیلتر کردن آگهی‌های خریداری شده =====
  const availableProducts = productList.filter((product) => !product.has_purchased);

  useEffect(() => {
    if (products?.totalPages) {
      setTotalPages(products.totalPages);
    }
  }, [products]);

  const router = useRouter();

  const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('access_token');

  const handleCreateAd = () => {
    if (!isAuthenticated) {
      router.push('/auth/mobile');
      return;
    }
    router.push('/market/create-ad');
  };

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && products?.hasMore) {
          setPage((prev) => prev + 1);
          setIsLoadingMore(true);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isLoadingMore, products?.hasMore]
  );

  useEffect(() => {
    if (!isLoadingMore) return;
    const timer = setTimeout(() => setIsLoadingMore(false), 500);
    return () => clearTimeout(timer);
  }, [isLoadingMore]);

  useEffect(() => {
    setPage(1);
  }, [query, activeCategory, filterCondition, sortBy]);

  const addToCart = (product: MarketProduct) => {
    if (!isAuthenticated) {
      window.location.href = '/auth/mobile';
      return;
    }

    const existing = cartItems.find((item) => item.id === product.id);

    if (existing) {
      alert('این محصول قبلاً به سبد خرید اضافه شده است');
      return;
    }

    const imageUrl =
      product.primary_image || product.image || product.image_url || product.images?.[0]?.url;

    addToCartApi(
      { adId: product.id, quantity: 1 },
      {
        onSuccess: () => {
          setCartItems((prev) => [
            ...prev,
            {
              id: product.id,
              title: product.title,
              price: product.price || product.priceAmount || 0,
              quantity: 1,
              image: imageUrl,
              maxQuantity: 1,
            },
          ]);
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.error?.message ||
            error?.response?.data?.message ||
            'خطا در افزودن به سبد خرید';
          alert(`❌ ${errorMessage}`);
        },
      }
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="relative">
      <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground">🛍️ بازارچه</h1>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative rounded-full p-3 transition-all duration-300 group bg-card shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] hover:scale-105 active:scale-95 ring-1 ring-border hover:ring-primary/50"
            aria-label="سبد خرید"
          >
            <ShoppingCart className="h-5 w-5 text-foreground group-hover:text-primary transition-all duration-300" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-lg ring-2 ring-background animate-pulse">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-[var(--radius)] bg-primary/5 px-4 py-3 ring-1 ring-primary/10">
          <div>
            <p className="text-xs font-black text-primary-text">بازار تاییدشده</p>
            <p className="text-sm font-bold text-foreground">خرید و فروش امن</p>
          </div>
          <div className="flex gap-3 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-primary" />
              تایید ادمین
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-primary" />
              سریع
            </span>
          </div>
        </div>

        <section className="sticky top-2 z-20 rounded-lg bg-background/90 pb-2 backdrop-blur">
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی کتاب، لپ‌تاپ، خوابگاه..."
              className="h-12 rounded-[var(--radius)] pr-12 text-sm"
              rightIcon={
                query ? (
                  <button
                    aria-label="clear search"
                    onClick={() => setQuery('')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-background-subtle text-foreground-muted transition hover:bg-border"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-background-subtle text-foreground-muted transition hover:bg-border"
                  >
                    <Filter className="h-4 w-4" />
                  </button>
                )
              }
            />
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-black transition-all duration-200 active:scale-95 ${
                activeCategory === 'all'
                  ? 'bg-primary text-white shadow-[var(--shadow)]'
                  : 'bg-card text-foreground-muted ring-1 ring-border hover:bg-background-subtle'
              }`}
            >
              همه
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-black transition-all duration-200 active:scale-95 ${
                  activeCategory === category.id
                    ? 'bg-primary text-white shadow-[var(--shadow)]'
                    : 'bg-card text-foreground-muted ring-1 ring-border hover:bg-background-subtle'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="mt-2 rounded-[var(--radius)] border border-border bg-card p-3 shadow-[var(--shadow)]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground-muted">وضعیت کالا</label>
                  <select
                    value={filterCondition}
                    onChange={(e) => setFilterCondition(e.target.value)}
                    className="mt-1 w-full input h-9 text-sm"
                  >
                    {CONDITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground-muted">مرتب‌سازی</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="mt-1 w-full input h-9 text-sm"
                  >
                    <option value="newest">جدیدترین</option>
                    <option value="price_asc">ارزان‌ترین</option>
                    <option value="price_desc">گران‌ترین</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-3 grid gap-2">
          {isLoading && page === 1 && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={`skeleton-${i}`} />
              ))}
            </>
          )}

          {!isLoading && availableProducts.length > 0
            ? availableProducts.map((product: MarketProduct, index: number) => {
                const isLast = index === availableProducts.length - 1;
                const imageUrl =
                  product.primary_image ||
                  product.image ||
                  product.image_url ||
                  product.images?.[0]?.url;

                return (
                  <div
                    key={product.id || index}
                    ref={isLast ? lastProductRef : null}
                    className="card flex gap-3 p-3 text-right transition-all hover:shadow-[var(--shadow-lg)] group"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="flex flex-1 gap-3 text-right"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-primary/10 to-secondary/10">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.title}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-foreground-muted/30" />
                          </div>
                        )}
                        <div className="absolute right-1 top-1 rounded-full bg-card/90 px-1.5 py-0.5 text-[8px] font-black text-foreground ring-1 ring-border/50 backdrop-blur-sm">
                          {getConditionLabel(product.condition)}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 py-0.5 text-right">
                        <p className="truncate text-sm font-black text-foreground">
                          {product.title}
                        </p>
                        <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-foreground-muted">
                          {product.seller_name && (
                            <span className="flex items-center gap-0.5 text-foreground-muted/60">
                              <User className="h-3 w-3" />
                              {product.seller_name}
                            </span>
                          )}
                          {product.campus && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {product.campus}
                            </span>
                          )}
                          {product.location && (
                            <span className="flex items-center gap-0.5 text-foreground-muted/60">
                              {product.location}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(product.created_at || product.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="badge badge-primary text-[8px]">
                            {product.category?.title ?? 'عمومی'}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black text-foreground">
                              {currencyFormatter.format(product.price || product.priceAmount || 0)}
                            </span>
                            <span className="text-[9px] text-foreground-muted">تومان</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {product.status === 'approved' && !product.isSold && !product.has_purchased && (
                      <button
                        onClick={() => addToCart(product)}
                        className="shrink-0 self-center rounded-full bg-primary/10 p-1.5 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
                        aria-label="افزودن به سبد خرید"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}

                    {product.has_purchased && (
                      <span className="shrink-0 self-center rounded-full bg-success/10 px-2 py-1 text-[10px] font-bold text-success">
                        ✅ خریداری شده
                      </span>
                    )}
                  </div>
                );
              })
            : !isLoading && (
                <div className="card p-8 text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-foreground-muted/30" />
                  <p className="mt-2 text-sm font-bold text-foreground-muted">
                    {productList.length > 0 && productList.every((p) => p.has_purchased)
                      ? 'همه محصولات را خریداری کرده‌اید'
                      : 'کالایی پیدا نشد'}
                  </p>
                  <p className="text-xs text-foreground-muted/60">
                    {productList.length > 0 && productList.every((p) => p.has_purchased)
                      ? 'برای مشاهده محصولات جدید به صفحه اصلی بازگردید'
                      : 'سعی کنید فیلترها را تغییر دهید'}
                  </p>
                </div>
              )}

          {isLoadingMore && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <ProductSkeleton key={`load-more-${i}`} />
              ))}
            </>
          )}
        </section>

        {!isLoading && availableProducts.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(page - 1, 1))}
              disabled={page === 1}
              className="rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground-muted transition hover:bg-background-subtle disabled:opacity-50 disabled:cursor-not-allowed"
            >
              قبلی
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && page > 3) {
                  pageNum = page - 2 + i;
                }
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-8 w-8 rounded-full text-xs font-bold transition ${
                      page === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground-muted hover:bg-background-subtle'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
              disabled={page === totalPages}
              className="rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground-muted transition hover:bg-background-subtle disabled:opacity-50 disabled:cursor-not-allowed"
            >
              بعدی
            </button>
          </div>
        )}
      </Container>

      <Link
        href="/market/create-ad"
        onClick={handleCreateAd}
        className="fixed bottom-20 right-5 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-black text-white shadow-(--shadow-lg) transition-all hover:scale-105 active:scale-95 lg:bottom-8"
      >
        <Plus className="h-5 w-5" />
        ثبت آگهی
      </Link>

      <ProductDetail
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />
    </main>
  );
}
