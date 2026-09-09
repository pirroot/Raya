'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, ImagePlus, Loader2, X } from 'lucide-react';
import { useSubmitAd, useCategories } from '@/lib/market/useMarket';
import type { MarketCategory } from '@/lib/market/types';
import api, { API_ENDPOINTS } from '@/lib/api';

const adSchema = z.object({
  images: z.array(z.instanceof(File)).min(1, 'حداقل ۱ تصویر').max(3, 'حداکثر ۳ تصویر'),
  title: z.string().min(3, 'عنوان حداقل ۳ کاراکتر').max(100, 'عنوان حداکثر ۱۰۰ کاراکتر'),
  description: z
    .string()
    .min(10, 'توضیحات حداقل ۱۰ کاراکتر')
    .max(1000, 'توضیحات حداکثر ۱۰۰۰ کاراکتر'),
  categoryId: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  condition: z.enum(['new', 'like_new', 'used', 'needs_repair']),
  campus: z.string().optional(),
  location: z.string().optional(),
  price: z.number().min(1000, 'قیمت حداقل ۱۰۰۰ تومان'),
});

type AdFormData = z.infer<typeof adSchema>;

export default function CreateAdPage() {
  const router = useRouter();
  const submitAd = useSubmitAd();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [stepError, setStepError] = useState('');
  const [user, setUser] = useState<{
    first_name: string;
    last_name: string;
    mobile: string;
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.USERS.ME);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (categoriesData?.items) {
      setCategories(categoriesData.items);
    }
  }, [categoriesData]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      condition: 'used',
      campus: '',
      location: '',
      price: 0,
      images: [],
    },
    mode: 'onChange',
  });

  const images = watch('images') || [];
  const totalSteps = 3;

  const validateStep = async (stepNumber: number): Promise<boolean> => {
    setStepError('');

    if (stepNumber === 1) {
      const isValid = await trigger(['images', 'title']);
      if (!isValid) {
        setStepError('لطفاً تصویر و عنوان را کامل کنید');
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      const isValid = await trigger(['description', 'categoryId']);
      if (!isValid) {
        setStepError('لطفاً توضیحات و دسته‌بندی را کامل کنید');
        return false;
      }
      return true;
    }

    if (stepNumber === 3) {
      const isValid = await trigger(['price']);
      if (!isValid) {
        setStepError('لطفاً قیمت را وارد کنید');
        return false;
      }
      return true;
    }

    return true;
  };

  const nextStep = async () => {
    if (await validateStep(step)) {
      setStep((s) => Math.min(s + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setStepError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const onSubmit = async (data: AdFormData) => {
    const isValid = await trigger();
    if (!isValid) {
      setStepError('لطفاً همه فیلدها را کامل کنید');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', String(data.price));
    formData.append('category', data.categoryId);
    formData.append('condition', data.condition);
    if (data.campus) formData.append('campus', data.campus);
    if (data.location) formData.append('location', data.location);
    data.images.forEach((file) => formData.append('image', file));

    if (user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      formData.append('seller_name', fullName || user.mobile);
      formData.append('seller_phone', user.mobile);
    } else {
      setStepError('اطلاعات کاربر یافت نشد. لطفاً دوباره وارد شوید.');
      setIsSubmitting(false);
      return;
    }

    try {
      await submitAd.mutateAsync(formData);
      setSuccess(true);
      setTimeout(() => router.push('/market'), 2000);
    } catch (error: any) {
      console.error(error);
      if (error?.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        const firstError = Object.values(details)[0];
        if (Array.isArray(firstError)) {
          setStepError(firstError[0] || 'خطا در ثبت آگهی');
        } else {
          setStepError('خطا در ثبت آگهی');
        }
      } else {
        setStepError('خطا در ثبت آگهی');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoriesLoading || loadingUser) {
    return (
      <Container className="max-w-lg py-6">
        <Card className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-sm text-foreground-muted">در حال بارگذاری...</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-lg py-6">
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-black text-foreground">ثبت آگهی جدید</h1>
            <span className="text-sm text-foreground-muted">
              مرحله {step} از {totalSteps}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition ${
                  i + 1 <= step ? 'bg-primary' : 'bg-background-subtle'
                }`}
              />
            ))}
          </div>
          {stepError && <p className="text-xs text-error mt-2 text-center">{stepError}</p>}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold">
                  تصاویر <span className="text-error">*</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((file, i) => (
                    <div key={i} className="relative h-20 w-20 rounded-lg border overflow-hidden">
                      <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setValue(
                            'images',
                            images.filter((_, idx) => idx !== i)
                          )
                        }
                        className="absolute -top-1 -right-1 rounded-full bg-error p-0.5 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:border-primary">
                      <ImagePlus className="h-6 w-6 text-foreground-muted" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (images.length + files.length > 3) {
                            alert('حداکثر ۳ تصویر');
                            return;
                          }
                          setValue('images', [...images, ...files]);
                        }}
                      />
                    </label>
                  )}
                </div>
                {errors.images && (
                  <p className="text-xs text-error mt-1">{errors.images.message}</p>
                )}
                <p className="text-[10px] text-foreground-muted/60 mt-1">
                  {images.length}/۳ عکس - حداقل ۱ عکس الزامی است
                </p>
              </div>

              <div>
                <label className="text-sm font-bold">
                  عنوان آگهی <span className="text-error">*</span>
                </label>
                <input
                  {...register('title')}
                  placeholder="مثلاً: جزوه ریاضی ۱"
                  className="input mt-1"
                />
                {errors.title && <p className="text-xs text-error mt-1">{errors.title.message}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold">
                  توضیحات <span className="text-error">*</span>
                </label>
                <textarea
                  {...register('description')}
                  placeholder="توضیحات کامل کالا، شرایط فروش..."
                  rows={4}
                  className="input mt-1 resize-none"
                />
                {errors.description && (
                  <p className="text-xs text-error mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold">
                    دسته‌بندی <span className="text-error">*</span>
                  </label>
                  <select {...register('categoryId')} className="input mt-1">
                    <option value="">انتخاب دسته‌بندی</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-xs text-error mt-1">{errors.categoryId.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-bold">وضعیت</label>
                  <select {...register('condition')} className="input mt-1">
                    <option value="new">نو</option>
                    <option value="like_new">در حد نو</option>
                    <option value="used">کارکرده</option>
                    <option value="needs_repair">نیازمند تعمیر</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold">
                  قیمت (تومان) <span className="text-error">*</span>
                </label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  placeholder="قیمت را وارد کنید"
                  className="input mt-1"
                />
                {errors.price && <p className="text-xs text-error mt-1">{errors.price.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold">محل تحویل</label>
                  <input
                    {...register('campus')}
                    placeholder="دانشگاه یا محل تحویل"
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold">آدرس دقیق</label>
                  <input
                    {...register('location')}
                    placeholder="آدرس دقیق محل تحویل"
                    className="input mt-1"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-background-subtle p-4 space-y-2">
                <p className="text-sm font-bold">📋 خلاصه آگهی</p>
                <div className="space-y-1 text-sm text-foreground-muted">
                  <p>
                    <span className="font-bold">عنوان:</span> {watch('title') || '-'}
                  </p>
                  <p>
                    <span className="font-bold">قیمت:</span>{' '}
                    {watch('price') ? `${watch('price').toLocaleString()} تومان` : '-'}
                  </p>
                  <p>
                    <span className="font-bold">دسته:</span>{' '}
                    {categories.find((c) => c.id === watch('categoryId'))?.title || '-'}
                  </p>
                  <p>
                    <span className="font-bold">وضعیت:</span>{' '}
                    {
                      {
                        new: 'نو',
                        like_new: 'در حد نو',
                        used: 'کارکرده',
                        needs_repair: 'نیازمند تعمیر',
                      }[watch('condition')]
                    }
                  </p>
                  <p>
                    <span className="font-bold">محل:</span> {watch('campus') || '-'}
                  </p>
                  <p>
                    <span className="font-bold">آدرس:</span> {watch('location') || '-'}
                  </p>
                  <p>
                    <span className="font-bold">تعداد عکس:</span> {images.length}
                  </p>
                </div>
              </div>

              {success && (
                <div className="rounded-xl bg-success/10 p-3 text-center text-sm text-success">
                  <CheckCircle className="inline h-4 w-4 mr-1" />
                  آگهی با موفقیت ثبت شد! منتظر تایید از طرف ادمین باشید.
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={prevStep} className="flex-1">
                <ChevronLeft className="h-4 w-4" />
                قبلی
              </Button>
            )}
            {step < totalSteps ? (
              <Button type="button" onClick={nextStep} className="flex-1">
                بعدی
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting || success} className="flex-1">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ثبت آگهی'}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </Container>
  );
}
