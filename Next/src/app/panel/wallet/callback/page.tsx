'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle, ArrowLeft, Home } from 'lucide-react';
import api, { API_ENDPOINTS } from '@/lib/api';

type VerifyResult = {
  success: boolean;
  status?: string;
  message?: string;
  ref_id?: string;
  amount?: number;
};

export default function WalletCallbackPage() {
  return (
    <Suspense fallback={<WalletCallbackShell verifying />}>
      <WalletCallbackContent />
    </Suspense>
  );
}

function WalletCallbackContent() {
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const authority = useMemo(
    () => searchParams.get('authority') || searchParams.get('Authority') || '',
    [searchParams]
  );
  const rawStatus = useMemo(
    () => (searchParams.get('status') || searchParams.get('Status') || '').toUpperCase(),
    [searchParams]
  );

  useEffect(() => {
    if (!authority || (rawStatus !== 'OK' && rawStatus !== 'NOK')) {
      setResult({
        success: false,
        message: 'پارامترهای بازگشتی از درگاه معتبر نیست.',
      });
      return;
    }

    const verify = async () => {
      setVerifying(true);
      try {
        const response = await api.post(API_ENDPOINTS.PAYMENT.VERIFY, {
          authority,
          status: rawStatus,
        });

        const data = response.data as VerifyResult;

        setResult({
          success: Boolean(data.success),
          status: data.status,
          ref_id: data.ref_id,
          amount: data.amount,
          message:
            data.message || (data.success ? 'پرداخت با موفقیت تایید شد.' : 'پرداخت ناموفق بود.'),
        });
      } catch (error: any) {
        setResult({
          success: false,
          status: 'failed',
          message: error.response?.data?.error || error.message || 'خطا در تایید تراکنش رخ داد.',
        });
      } finally {
        setVerifying(false);
      }
    };

    void verify();
  }, [authority, rawStatus]);

  return <WalletCallbackShell verifying={verifying} result={result} />;
}

function WalletCallbackShell({
  verifying,
  result,
}: {
  verifying: boolean;
  result?: VerifyResult | null;
}) {
  const isSuccess = result?.success === true;
  const isError = result?.success === false;

  return (
    <main className="mx-auto flex w-full max-w-md items-center justify-center bg-background p-4">
      <section className="card w-full p-6 text-center">
        {verifying ? (
          <div className="space-y-4">
            <div className="relative mx-auto h-20 w-20">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <Loader2 className="absolute inset-0 h-20 w-20 animate-spin text-primary" />
            </div>
            <h1 className="text-lg font-black text-foreground">در حال تایید پرداخت</h1>
            <p className="text-sm text-foreground-muted">لطفاً چند لحظه صبر کنید...</p>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
            <h1 className="text-lg font-black text-success">پرداخت موفق ✅</h1>
            <p className="text-sm text-foreground-muted">{result?.message}</p>
            {result?.ref_id && (
              <p className="text-xs text-foreground-muted font-mono">
                شماره تراکنش: {result.ref_id}
              </p>
            )}
          </div>
        ) : isError ? (
          <div className="space-y-4">
            <XCircle className="mx-auto h-16 w-16 text-error" />
            <h1 className="text-lg font-black text-error">پرداخت ناموفق ❌</h1>
            <p className="text-sm text-foreground-muted">{result?.message}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <XCircle className="mx-auto h-16 w-16 text-slate-400" />
            <h1 className="text-lg font-black text-foreground">وضعیت نامشخص</h1>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Link href="/panel/wallet" className="btn btn-primary w-full">
            <ArrowLeft className="h-4 w-4" />
            بازگشت به کیف پول
          </Link>
          <Link href="/panel" className="btn btn-secondary w-full">
            <Home className="h-4 w-4" />
            بازگشت به پنل کاربری
          </Link>
        </div>
      </section>
    </main>
  );
}
