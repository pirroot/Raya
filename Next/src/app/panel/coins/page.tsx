'use client';

import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import {
  useCoinsBalance,
  useCoinsTransactions,
  usePurchaseCoins,
  useSpendCoins,
} from '@/lib/api/hooks/useCoins';
import {
  coinsPurchaseSchema,
  coinsSpendSchema,
  type CoinsPurchase,
  type CoinsSpend,
  type CoinsTransactionsQuery,
} from '@/lib/validation/coins';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

const amountFormatter = new Intl.NumberFormat('fa-IR');

const reasonLabel: Record<string, string> = {
  reward: 'پاداش',
  spend: 'مصرف',
  purchase: 'خرید',
  adjustment: 'اصلاح',
  refund: 'بازگشت',
  course_enrollment: 'ثبت‌نام دوره',
  convert_from_wallet: 'تبدیل از کیف پول',
};

const statusLabel: Record<string, string> = {
  pending: 'در انتظار',
  committed: 'ثبت شده',
  failed: 'ناموفق',
  reverted: 'برگشت خورده',
  success: 'موفق',
};

const statusClasses: Record<string, string> = {
  pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  committed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  failed: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  reverted: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400',
};

function toLocaleDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString('fa-IR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CoinsPage() {
  const [page, setPage] = useState(1);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'purchase' | 'spend'>('purchase');

  const {
    data: balance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
    isError: balanceError,
  } = useCoinsBalance();

  const queryParams: CoinsTransactionsQuery = {
    page,
    limit: 20,
  };

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
    isError: transactionsError,
  } = useCoinsTransactions(queryParams);

  const purchaseMutation = usePurchaseCoins();
  const spendMutation = useSpendCoins();

  // Purchase form
  const {
    control: purchaseControl,
    handleSubmit: handlePurchaseSubmit,
    reset: resetPurchase,
    formState: { errors: purchaseErrors, isSubmitting: isPurchasing },
  } = useForm<CoinsPurchase>({
    resolver: zodResolver(coinsPurchaseSchema),
    defaultValues: {
      amount: 10,
    },
  });

  // Spend form
  const {
    control: spendControl,
    handleSubmit: handleSpendSubmit,
    reset: resetSpend,
    formState: { errors: spendErrors, isSubmitting: isSpending },
  } = useForm<CoinsSpend>({
    resolver: zodResolver(coinsSpendSchema),
    defaultValues: {
      amount: 1,
      reason: 'spend',
    },
  });

  const onPurchase = async (data: CoinsPurchase) => {
    try {
      await purchaseMutation.mutateAsync(data);
      resetPurchase();
    } catch (error) {
      console.error('Purchase error:', error);
    }
  };

  const onSpend = async (data: CoinsSpend) => {
    try {
      await spendMutation.mutateAsync(data);
      resetSpend();
    } catch (error) {
      console.error('Spend error:', error);
    }
  };

  const handleRefresh = () => {
    refetchBalance();
    refetchTransactions();
  };

  const transactions = transactionsData?.items ?? [];
  const totalPages = transactionsData?.totalPages ?? 1;
  const currentPage = transactionsData?.page ?? page;

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-foreground">سکه‌ها</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-secondary rounded-[var(--radius)] p-2.5"
            aria-label="بازخوانی اطلاعات"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <Link href="/panel" className="btn btn-secondary rounded-[var(--radius)] p-2.5">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white shadow-[var(--shadow-lg)]">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">موجودی سکه‌ها</p>
            <p className="mt-1 text-3xl font-black">
              {balanceLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : showBalance ? (
                `${amountFormatter.format(balance?.balance || 0)} سکه`
              ) : (
                '••••••'
              )}
            </p>
            <p className="mt-1 text-xs text-white/70">
              نرخ: هر ۱ سکه = {amountFormatter.format(balance?.ratePerCoin || 1000)} تومان
            </p>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="rounded-full bg-white/20 p-2 backdrop-blur-sm transition hover:bg-white/30"
          >
            {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mt-4 flex gap-2 rounded-[var(--radius)] bg-background-subtle p-1">
        <button
          onClick={() => setActiveTab('purchase')}
          className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-bold transition ${
            activeTab === 'purchase'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          خرید سکه
        </button>
        <button
          onClick={() => setActiveTab('spend')}
          className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-bold transition ${
            activeTab === 'spend'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          مصرف سکه
        </button>
      </div>

      {/* Forms */}
      <div className="mt-4">
        {activeTab === 'purchase' ? (
          <Card className="p-4">
            <h2 className="mb-1 text-sm font-black text-foreground">خرید سکه</h2>
            <p className="mb-3 text-xs text-foreground-muted">
              با خرید سکه از خدمات ویژه استفاده کنید
            </p>

            <form onSubmit={handlePurchaseSubmit(onPurchase)} className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground-muted">تعداد سکه</label>
                <Controller
                  name="amount"
                  control={purchaseControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min={1}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="input"
                      placeholder="تعداد سکه را وارد کنید"
                    />
                  )}
                />
                {purchaseErrors.amount && (
                  <p className="text-xs text-error">{purchaseErrors.amount.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPurchasing || purchaseMutation.isPending}
                className="btn btn-primary w-full"
              >
                {isPurchasing || purchaseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
                خرید سکه
              </button>
            </form>
          </Card>
        ) : (
          <Card className="p-4">
            <h2 className="mb-1 text-sm font-black text-foreground">مصرف سکه</h2>
            <p className="mb-3 text-xs text-foreground-muted">
              از سکه‌های خود برای استفاده از خدمات استفاده کنید
            </p>

            <form onSubmit={handleSpendSubmit(onSpend)} className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground-muted">تعداد سکه</label>
                <Controller
                  name="amount"
                  control={spendControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min={1}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="input"
                      placeholder="تعداد سکه را وارد کنید"
                    />
                  )}
                />
                {spendErrors.amount && (
                  <p className="text-xs text-error">{spendErrors.amount.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSpending || spendMutation.isPending}
                className="btn btn-primary w-full"
              >
                {isSpending || spendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                مصرف سکه
              </button>
            </form>
          </Card>
        )}
      </div>

      {/* Transactions */}
      <Card className="mt-4 p-4">
        <h2 className="mb-3 text-sm font-black text-foreground">تاریخچه سکه</h2>

        {transactionsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-foreground-muted">
            تراکنشی برای نمایش وجود ندارد.
          </div>
        ) : (
          <ul className="space-y-2">
            {transactions.map((transaction: any) => (
              <li
                key={transaction.id}
                className="rounded-xl border border-border bg-background-subtle p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-foreground">
                      {reasonLabel[transaction.reason] || transaction.reason}
                    </p>
                    <p className="mt-1 text-[11px] text-foreground-muted">
                      {toLocaleDate(transaction.created_at || transaction.createdAt)}
                    </p>
                    {transaction.description && (
                      <p className="mt-1 text-[11px] text-foreground-muted">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-xs font-black ${
                        transaction.type === 'credit' || transaction.amount > 0
                          ? 'text-success'
                          : 'text-foreground'
                      }`}
                    >
                      {transaction.type === 'credit' || transaction.amount > 0 ? '+' : '-'}
                      {amountFormatter.format(Math.abs(transaction.amount))}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        statusClasses[transaction.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {statusLabel[transaction.status] || transaction.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              disabled={currentPage <= 1 || transactionsLoading}
              onClick={() => setPage((p) => p - 1)}
              className="btn btn-secondary h-9 px-3 text-xs disabled:opacity-50"
            >
              صفحه قبل
            </button>
            <span className="text-[11px] text-foreground-muted">
              صفحه {amountFormatter.format(currentPage)} از {amountFormatter.format(totalPages)}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || transactionsLoading}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-secondary h-9 px-3 text-xs disabled:opacity-50"
            >
              صفحه بعد
            </button>
          </div>
        )}

        {transactionsError && <p className="mt-2 text-xs text-error">خطا در دریافت تراکنش‌ها</p>}
      </Card>
    </Container>
  );
}
