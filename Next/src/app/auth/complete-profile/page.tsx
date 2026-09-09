'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';

const profileSchema = z.object({
  first_name: z.string().min(2, 'نام حداقل ۲ کاراکتر'),
  last_name: z.string().min(2, 'نام خانوادگی حداقل ۲ کاراکتر'),
  username: z
    .string()
    .min(3, 'یوزرنیم حداقل ۳ کاراکتر')
    .max(30, 'یوزرنیم حداکثر ۳۰ کاراکتر')
    .regex(/^[a-zA-Z0-9_]+$/, 'فقط حروف انگلیسی، اعداد و زیرخط مجاز است'),
  student_code: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      student_code: '',
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/mobile');
    }
  }, [router]);

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    setError('');
    setUsernameError('');
    setSuccess(false);

    try {
      await api.patch(API_ENDPOINTS.USERS.PROFILE, {
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        student_code: data.student_code || '',
      });

      setSuccess(true);
      setLoading(false);

      document.cookie =
        'registration_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie =
        'registration_step=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      localStorage.removeItem('registration_token');
      localStorage.removeItem('registration_step');

      setTimeout(() => {
        window.location.href = '/panel';
      }, 500);
    } catch (err: any) {
      if (err.response?.data?.username) {
        setUsernameError('این یوزرنیم قبلاً ثبت شده است');
      } else {
        setError(err.response?.data?.message || 'خطا در ذخیره اطلاعات');
      }
      setLoading(false);
      setSuccess(false);
    }
  };

  return (
    <Container className="flex items-center justify-center py-8">
      <Card className="p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-foreground">تکمیل اطلاعات</h1>
          <p className="text-sm text-foreground-muted mt-1">لطفاً اطلاعات پایه خود را وارد کنید</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-foreground-muted">نام</label>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <input {...field} placeholder="نام خود را وارد کنید" className="input mt-1" />
              )}
            />
            {errors.first_name && (
              <p className="text-xs text-error mt-1">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-foreground-muted">نام خانوادگی</label>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  placeholder="نام خانوادگی خود را وارد کنید"
                  className="input mt-1"
                />
              )}
            />
            {errors.last_name && (
              <p className="text-xs text-error mt-1">{errors.last_name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-foreground-muted">یوزرنیم</label>
            <div className="relative mt-1">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                @
              </span>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <input {...field} placeholder="username" className="input pr-8" />
                )}
              />
            </div>
            {(errors.username || usernameError) && (
              <p className="text-xs text-error mt-1">{usernameError || errors.username?.message}</p>
            )}
            <p className="text-xs text-foreground-muted mt-1">
              فقط حروف انگلیسی، اعداد و زیرخط مجاز است
            </p>
          </div>

          <div>
            <label className="text-sm font-bold text-foreground-muted">کد دانشجویی (اختیاری)</label>
            <Controller
              name="student_code"
              control={control}
              render={({ field }) => (
                <input {...field} placeholder="مثال: 40123456" className="input mt-1" />
              )}
            />
          </div>

          {success && (
            <div className="rounded-xl bg-success/10 p-3 text-sm text-success text-center">
              ✅ اطلاعات با موفقیت ذخیره شد! در حال انتقال...
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-error/10 p-3 text-sm text-error text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || loading || success}
            className="btn btn-primary w-full h-12 text-sm font-bold disabled:opacity-50"
          >
            {isSubmitting || loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                در حال ثبت...
              </span>
            ) : success ? (
              '✅ ثبت شد!'
            ) : (
              'تکمیل اطلاعات و ورود'
            )}
          </button>
        </form>
      </Card>
    </Container>
  );
}
