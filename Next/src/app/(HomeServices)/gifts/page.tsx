'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Gift,
  Percent,
  Clock,
  Copy,
  CheckCircle,
  Share2,
  Star,
  Crown,
  Loader2,
  Tag,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';
import { isAuthError } from '@/lib/api-error';
import toast from 'react-hot-toast';

// ===== Types =====
interface GiftItem {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'gift' | 'voucher';
  discount_type: 'percent' | 'amount';
  discount_type_display: string;
  discount_value: number;
  code: string;
  expires_at: string;
  is_active: boolean;
  is_used_by_user: boolean;
  is_expired: boolean;
  used_count: number;
  max_uses_per_user: number;
  max_uses_total: number;
  applies_to: 'all' | 'market' | 'courses' | 'books';
  applies_to_display: string;
}

// ===== Constants =====
const typeLabels: Record<GiftItem['type'], { label: string; icon: any; color: string }> = {
  discount: {
    label: 'تخفیف',
    icon: Percent,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  },
  gift: {
    label: 'هدیه',
    icon: Gift,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  },
  voucher: {
    label: 'اشتراک',
    icon: Crown,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  },
};

const appliesToLabels: Record<string, string> = {
  all: 'همه',
  market: 'فروشگاه',
  courses: 'دوره‌ها',
  books: 'جزوه‌ها',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDiscount(gift: GiftItem): string {
  if (gift.discount_type === 'percent') {
    return `${gift.discount_value}%`;
  }
  return `${gift.discount_value.toLocaleString('fa-IR')} تومان`;
}

export default function GiftsPage() {
  const router = useRouter();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'used'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [showRedeemInput, setShowRedeemInput] = useState(false);

  // ===== Load Gifts =====
  useEffect(() => {
    loadGifts();
  }, []);

  const loadGifts = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.GIFTS.LIST);
      const data = Array.isArray(response.data?.results) ? response.data.results : [];
      setGifts(data);
    } catch (error) {
      if (isAuthError(error)) {
        router.replace('/auth/mobile');
        return;
      }
      console.error('Error loading gifts:', error);
      setGifts([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== Validate Gift =====
  const handleValidate = async (code: string) => {
    if (!code.trim()) {
      toast.error('لطفاً کد تخفیف را وارد کنید');
      return;
    }

    setValidating(code);
    try {
      const response = await api.post(API_ENDPOINTS.GIFTS.VALIDATE, {
        code: code.trim().toUpperCase(),
        total_amount: 0,
        order_type: 'all',
      });

      if (response.data?.valid) {
        toast.success('کد تخفیف معتبر است!');
        setShowRedeemInput(false);
        setInputCode('');
        loadGifts();
      } else {
        toast.error(response.data?.message || 'کد تخفیف نامعتبر است');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطا در اعتبارسنجی کد');
    } finally {
      setValidating(null);
    }
  };

  // ===== Copy Code =====
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('کد کپی شد!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ===== Share =====
  const handleShare = (gift: GiftItem) => {
    const text = `${gift.title}\nکد: ${gift.code}\n${gift.description}`;
    if (navigator.share) {
      navigator.share({ title: gift.title, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedCode(gift.code);
      toast.success('کد کپی شد!');
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // ===== Filter =====
  const filteredGifts = gifts.filter((gift) => {
    if (activeTab === 'available') return !gift.is_used_by_user && !gift.is_expired;
    if (activeTab === 'used') return gift.is_used_by_user;
    return true;
  });

  // ===== Loading =====
  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Container>
    );
  }

  const availableCount = gifts.filter((g) => !g.is_used_by_user && !g.is_expired).length;

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/panel"
            className="btn btn-secondary rounded-[var(--radius)] p-2 hover:scale-105 transition-all"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-black text-foreground">🎁 کدهای تخفیف</h1>
        </div>
        <span className="badge badge-primary text-xs">{availableCount} کد فعال</span>
      </div>

      {/* Redeem Input */}
      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            {!showRedeemInput ? (
              <button
                onClick={() => setShowRedeemInput(true)}
                className="w-full rounded-[var(--radius)] bg-background-subtle px-4 py-2 text-sm text-foreground-muted text-right hover:bg-background-subtle/80 transition-colors"
              >
                کد تخفیف دارید؟ وارد کنید...
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="کد تخفیف را وارد کنید"
                  className="flex-1 rounded-[var(--radius)] border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleValidate(inputCode);
                    if (e.key === 'Escape') {
                      setShowRedeemInput(false);
                      setInputCode('');
                    }
                  }}
                />
                <button
                  onClick={() => handleValidate(inputCode)}
                  disabled={validating === inputCode || !inputCode.trim()}
                  className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {validating === inputCode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'بررسی'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowRedeemInput(false);
                    setInputCode('');
                  }}
                  className="rounded-[var(--radius)] bg-background-subtle px-3 py-2 text-sm text-foreground-muted hover:bg-background-subtle/80 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 rounded-[var(--radius)] bg-background-subtle p-1">
        {[
          { id: 'all', label: 'همه' },
          { id: 'available', label: 'فعال' },
          { id: 'used', label: 'استفاده شده' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gifts Grid */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filteredGifts.length === 0 ? (
          <Card className="col-span-1 lg:col-span-2 p-8 text-center">
            <Gift className="mx-auto h-10 w-10 text-foreground-muted/30" />
            <p className="mt-2 text-sm font-bold text-foreground-muted">
              {activeTab === 'available' ? 'کد تخفیفی موجود نیست' : 'کد تخفیفی استفاده نشده'}
            </p>
            <p className="text-xs text-foreground-muted/60">
              {activeTab === 'available'
                ? 'به زودی کدهای تخفیف جدید اضافه می‌شود'
                : 'از کدهای تخفیف برای خرید استفاده کنید'}
            </p>
          </Card>
        ) : (
          filteredGifts.map((gift) => {
            const typeInfo = typeLabels[gift.type] || typeLabels.discount;
            const Icon = typeInfo.icon;
            const isDisabled = gift.is_used_by_user || gift.is_expired;

            return (
              <Card
                key={gift.id}
                className={`overflow-hidden transition-all hover:shadow-[var(--shadow-lg)] ${
                  isDisabled ? 'opacity-60' : 'hover:scale-[1.02]'
                }`}
              >
                <div className="flex gap-4 p-4">
                  {/* Icon */}
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius)] ${typeInfo.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="badge text-[8px]">{typeInfo.label}</span>
                          {gift.applies_to !== 'all' && (
                            <span className="badge bg-primary/10 text-primary text-[8px]">
                              {gift.applies_to_display}
                            </span>
                          )}
                          {gift.is_used_by_user && (
                            <span className="badge bg-error/10 text-error text-[8px]">
                              استفاده شده
                            </span>
                          )}
                          {gift.is_expired && !gift.is_used_by_user && (
                            <span className="badge bg-amber-500/10 text-amber-500 text-[8px]">
                              منقضی شده
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 truncate text-sm font-black text-foreground">
                          {gift.title}
                        </h3>
                      </div>
                      <span className="text-lg font-black text-primary">
                        {formatDiscount(gift)}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-1 text-xs text-foreground-muted">
                      {gift.description}
                    </p>

                    {/* Code & Actions */}
                    {gift.code && !isDisabled && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="rounded-[var(--radius-sm)] bg-background-subtle px-3 py-1 font-mono text-xs font-bold text-foreground">
                          {gift.code}
                        </div>
                        <button
                          onClick={() => handleCopy(gift.code)}
                          className="rounded-full p-1 hover:bg-background-subtle transition-colors"
                        >
                          {copiedCode === gift.code ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4 text-foreground-muted" />
                          )}
                        </button>
                        <button
                          onClick={() => handleShare(gift)}
                          className="rounded-full p-1 hover:bg-background-subtle transition-colors"
                        >
                          <Share2 className="h-4 w-4 text-foreground-muted" />
                        </button>
                        <span className="text-[10px] text-foreground-muted/60 mr-auto">
                          {gift.max_uses_per_user > 0
                            ? `${gift.max_uses_per_user - (gift.is_used_by_user ? 1 : 0)} بار باقی‌مانده`
                            : 'نامحدود'}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-foreground-muted">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        اعتبار تا: {formatDate(gift.expires_at)}
                      </span>
                      {gift.used_count > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3" />
                          {gift.used_count} استفاده
                        </span>
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
  );
}
