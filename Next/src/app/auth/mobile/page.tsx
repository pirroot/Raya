'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api-error';
import { MOBILE_ERROR_MESSAGE, validateMobile } from '@/lib/validation/auth';
import { AUTH_OTP_PATH, PANEL_PATH } from '@/lib/auth-constants';
import { resetAuthFlowState } from '@/lib/auth-flow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function MobilePage() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const mobileValidation = validateMobile(mobile);
  const shouldShowClientError = touched && !mobileValidation.isValid;
  const canSubmit = mobileValidation.isValid && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError('');

    if (!mobileValidation.isValid) {
      setError(MOBILE_ERROR_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const normalizedMobile = mobileValidation.normalized;
      resetAuthFlowState();

      const payload = {
        mobile: normalizedMobile,
        purpose: 'login',
      };

      const response = await api.post('/auth/send-otp/', payload);

      if (response.data?.otp_code) {
        sessionStorage.setItem('dev_otp_code', response.data.otp_code);
        sessionStorage.setItem('dev_mobile', normalizedMobile);
      }

      router.replace(AUTH_OTP_PATH);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'خطا در ارسال کد'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col">
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="btn btn-secondary rounded-[var(--radius)] px-4 py-2.5 text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            بازگشت
          </Link>
          <Link
            href={PANEL_PATH}
            className="btn btn-secondary rounded-[var(--radius)] px-4 py-2.5 text-xs"
          >
            وارد شده‌اید؟
          </Link>
        </div>

        {/* ===== Hero ===== */}
        <div className="mt-4 flex-1 space-y-5 pb-6">
          {/* ===== Form ===== */}
          <section className="card p-4 shadow-[var(--shadow-lg)]">
            <div className="mb-4">
              <h2 className="text-sm font-extrabold text-foreground">شماره موبایل</h2>
              <p className="mt-1 text-xs leading-6 text-foreground-muted">
                شماره باید با <span className="font-bold text-primary">09</span> شروع شود.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={11}
                placeholder="09123456789"
                value={mobile}
                onChange={(e) => {
                  const nextValue = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setMobile(nextValue);
                  if (!touched) setTouched(true);
                  if (error) setError('');
                }}
                onBlur={() => setTouched(true)}
                error={error || (shouldShowClientError ? MOBILE_ERROR_MESSAGE : undefined)}
                className="h-14 rounded-[var(--radius)] text-center text-xl font-bold tracking-[0.08em]"
                disabled={loading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canSubmit}
                className="rounded-[var(--radius)] text-base"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    دریافت کد تایید
                    <ArrowLeft className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
