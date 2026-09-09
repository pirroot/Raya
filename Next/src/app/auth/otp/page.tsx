'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api-error';
import { OTP_ERROR_MESSAGE, sanitizeOtpInput, validateOtp } from '@/lib/validation/auth';
import { AUTH_MOBILE_PATH, AUTH_PROFILE_PATH, PANEL_PATH } from '@/lib/auth-constants';
import { resetAuthFlowState } from '@/lib/auth-flow';
import api from '@/lib/api';

export default function OtpPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [touched, setTouched] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState('');
  const [isProduction, setIsProduction] = useState(false);
  const otpValidation = validateOtp(code);
  const canSubmit = otpValidation.isValid && !loading;

  useEffect(() => {
    // بررسی محیط
    setIsProduction(process.env.NODE_ENV === 'production');
    setDevOtpCode(sessionStorage.getItem('dev_otp_code') || '');
    setReady(true);
  }, []);

  useEffect(() => {
    if (canResend) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [canResend]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    if (!otpValidation.isValid) {
      setError(OTP_ERROR_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp/', {
        code: otpValidation.value,
        mobile: sessionStorage.getItem('dev_mobile') || '',
        purpose: 'login',
      });

      if (response.data?.tokens?.access) {
        localStorage.setItem('access_token', response.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
        document.cookie = `access_token=${response.data.tokens.access}; path=/; max-age=86400; samesite=Lax`;
      }

      if (response.data?.is_new_user) {
        sessionStorage.removeItem('dev_otp_code');
        window.location.replace(AUTH_PROFILE_PATH);
        return;
      }
      resetAuthFlowState();
      sessionStorage.removeItem('dev_otp_code');
      window.location.replace(PANEL_PATH);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'خطا در تایید کد'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const mobile = sessionStorage.getItem('dev_mobile') || '';
      const response = await api.post('/auth/send-otp/', {
        mobile: mobile,
        purpose: 'login',
      });

      setTimer(120);
      setCanResend(false);
      setError('');

      // فقط در محیط توسعه کد رو نشون بده
      if (!isProduction && typeof response.data?.otp_code === 'string') {
        sessionStorage.setItem('dev_otp_code', response.data.otp_code);
        setDevOtpCode(response.data.otp_code);
      } else {
        sessionStorage.removeItem('dev_otp_code');
        setDevOtpCode('');
      }
    } catch {
      setError('خطا در ارسال مجدد');
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.replace(AUTH_MOBILE_PATH)}
            className="btn btn-secondary rounded-[var(--radius)] px-4 py-2.5 text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            ویرایش شماره
          </button>
          <button
            type="button"
            onClick={() => router.replace(PANEL_PATH)}
            className="btn btn-secondary rounded-[var(--radius)] px-4 py-2.5 text-xs"
          >
            حساب فعال دارم
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-5 pb-6">
          <section className="card p-4 shadow-[var(--shadow-lg)]">
            <form onSubmit={handleVerify} className="space-y-6">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="------"
                className={`h-16 w-full rounded-[var(--radius)] border-2 bg-background-subtle px-4 text-center text-3xl font-bold tracking-[0.5em] text-foreground outline-none ${
                  (touched && !otpValidation.isValid) || error
                    ? 'border-error focus:border-error'
                    : 'border-border focus:border-primary'
                }`}
                value={code}
                onChange={(e) => {
                  setCode(sanitizeOtpInput(e.target.value));
                  if (!touched) setTouched(true);
                  if (error) setError('');
                }}
                onBlur={() => setTouched(true)}
                autoFocus
              />
              {(error || (touched && !otpValidation.isValid)) && (
                <p className="text-center text-sm text-error">{error || OTP_ERROR_MESSAGE}</p>
              )}

              <div className="flex justify-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <RefreshCw size={16} /> ارسال مجدد
                  </button>
                ) : (
                  <span className="rounded-full bg-background-subtle px-4 py-2 font-mono text-lg text-foreground-muted">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* فقط در محیط توسعه کد تست رو نشون بده */}
              {!isProduction && devOtpCode && (
                <p className="rounded-[var(--radius)] border border-warning/30 bg-warning/10 px-3 py-2 text-center text-xs font-semibold text-warning">
                  کد تست: {devOtpCode}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="btn btn-primary w-full h-14 text-base"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تایید و ادامه'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
