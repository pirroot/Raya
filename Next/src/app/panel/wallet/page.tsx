'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreditCard,
  Loader2,
  RefreshCcw,
  Wallet,
  Eye,
  EyeOff,
  Mail,
  Phone,
  ArrowLeft,
} from 'lucide-react';
import {
  walletTopupSchema,
  type WalletTopup,
  type WalletTransactionsQuery,
} from '@/lib/validation/wallet';
import { useWalletOverview, useTransactions, useTopup } from '@/lib/api/hooks/useWallet';
import type {
  WalletTransaction,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@/components/panel/types';

const amountFormatter = new Intl.NumberFormat('fa-IR');
const presetAmounts = [10000, 50000, 100000, 200000];

// Type-safe mappings
const transactionTypeLabels: Record<WalletTransactionType, string> = {
  credit: 'واریز',
  debit: 'برداشت',
  refund: 'بازگشت وجه',
  adjustment: 'اصلاح',
};

const transactionStatusLabels: Record<WalletTransactionStatus, string> = {
  pending: 'در انتظار',
  committed: 'ثبت شده',
  reversed: 'برگشت خورده',
  failed: 'ناموفق',
};

const transactionStatusClasses: Record<WalletTransactionStatus, string> = {
  pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  committed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  reversed: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400',
  failed: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
};

function toLocaleDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleString('fa-IR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WalletDashboard() {
  const [page, setPage] = useState(1);
  const [showBalance, setShowBalance] = useState(true);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [userMobile, setUserMobile] = useState<string>('');

  // Load user mobile from sessionStorage
  useEffect(() => {
    const mobile = sessionStorage.getItem('dev_mobile') || '';
    setUserMobile(mobile);
  }, []);

  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
    isError: overviewError,
  } = useWalletOverview();

  const queryParams: WalletTransactionsQuery = {
    page,
    limit: 20,
  };

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
    isError: transactionsError,
  } = useTransactions(queryParams);

  const topupMutation = useTopup();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WalletTopup>({
    resolver: zodResolver(walletTopupSchema),
    defaultValues: {
      amount: 50000,
      description: 'شارژ کیف پول',
      mobile: userMobile,
    },
  });

  // Reset form when userMobile changes
  useEffect(() => {
    reset((prev) => ({
      ...prev,
      mobile: userMobile,
    }));
  }, [userMobile, reset]);

  const topupAmount = watch('amount');

  const onSubmit = async (data: WalletTopup) => {
    setTopupError(null);
    try {
      const result = await topupMutation.mutateAsync(data);
      if (result.payment_url) {
        window.location.assign(result.payment_url);
      }
    } catch (error) {
      setTopupError(error instanceof Error ? error.message : 'خطا در شروع فرآیند پرداخت');
    }
  };

  const handleRefresh = () => {
    refetchOverview();
    refetchTransactions();
  };

  const pendingAmount = overview?.pendingAmount || 0;

  // Safe access to transactions with proper type checking
  const transactions = (transactionsData as any)?.items ?? [];
  const totalPages = (transactionsData as any)?.totalPages ?? 1;
  const currentPage = (transactionsData as any)?.page ?? page;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background pb-24">
      {/* Header */}
      <section className="rounded-3xl border-b border-border bg-card px-4 pb-6 pt-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-background-subtle transition-colors"
            aria-label="بازخوانی اطلاعات کیف پول"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <h1 className="text-base font-black text-foreground">کیف پول</h1>
          <Link
            href="/panel"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-background-subtle transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        {/* Balance Card */}
        <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary-soft to-primary/10 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-primary-text dark:text-primary">
              موجودی قابل استفاده
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-primary-text dark:text-primary hover:opacity-70"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <Wallet className="h-5 w-5 text-primary-text dark:text-primary" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">
            {overviewLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : showBalance ? (
              `${amountFormatter.format(overview?.balance || 0)} تومان`
            ) : (
              '••••••'
            )}
          </p>
          {pendingAmount > 0 && (
            <p className="mt-1 text-xs text-foreground-muted">
              شارژ در انتظار تایید: {amountFormatter.format(pendingAmount)} تومان
            </p>
          )}
          {overviewError && <p className="mt-1 text-xs text-error">خطا در دریافت اطلاعات</p>}
        </div>
      </section>

      {/* Content */}
      <section className="space-y-4 p-4">
        {/* Topup Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="card p-4">
          <h2 className="mb-3 text-sm font-black text-foreground">شارژ کیف پول</h2>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground-muted">مبلغ (تومان)</label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min={1000}
                  step={1000}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="input"
                  placeholder="مبلغ را وارد کنید"
                />
              )}
            />
            {errors.amount && <p className="text-xs text-error">{errors.amount.message}</p>}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setValue('amount', amount)}
                className={`h-10 rounded-xl border text-xs font-bold transition-colors
                  ${
                    topupAmount === amount
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background-subtle text-foreground hover:bg-border'
                  }`}
              >
                {amountFormatter.format(amount)} تومان
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <label className="text-xs font-bold text-foreground-muted flex items-center gap-1">
              <Phone className="h-3 w-3" />
              شماره موبایل
            </label>
            <Controller
              name="mobile"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="tel"
                  placeholder="مثال: 09123456789"
                  className="input bg-background-subtle"
                  dir="ltr"
                  readOnly
                />
              )}
            />
          </div>

          <div className="mt-3 space-y-2">
            <label className="text-xs font-bold text-foreground-muted flex items-center gap-1">
              <Mail className="h-3 w-3" />
              ایمیل (اختیاری)
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  placeholder="example@email.com"
                  className="input"
                  dir="ltr"
                />
              )}
            />
            {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || topupMutation.isPending}
            className="btn btn-primary mt-4 w-full"
          >
            {isSubmitting || topupMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            انتقال به درگاه پرداخت
          </button>

          {topupError && <p className="mt-2 text-xs text-error">{topupError}</p>}
        </form>

        {/* Transactions */}
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-black text-foreground">تاریخچه تراکنش‌ها</h2>

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
              {transactions.map((transaction: WalletTransaction) => (
                <li
                  key={transaction.id}
                  className="rounded-xl border border-border bg-background-subtle p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-foreground">
                        {transactionTypeLabels[transaction.type] || transaction.type}
                      </p>
                      <p className="mt-1 text-[11px] text-foreground-muted">
                        {toLocaleDate(transaction.createdAt)}
                      </p>
                      {transaction.reference && (
                        <p className="mt-1 text-[11px] text-foreground-muted font-mono">
                          Ref: {transaction.reference}
                        </p>
                      )}
                      {transaction.description && (
                        <p className="mt-1 text-[11px] text-foreground-muted">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-xs font-black ${
                          transaction.type === 'credit' || transaction.type === 'refund'
                            ? 'text-success'
                            : 'text-foreground'
                        }`}
                      >
                        {transaction.type === 'credit' || transaction.type === 'refund' ? '+' : ''}
                        {amountFormatter.format(transaction.amount)} تومان
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          transactionStatusClasses[transaction.status] ||
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {transactionStatusLabels[transaction.status] || transaction.status}
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
        </section>
      </section>
    </main>
  );
}
