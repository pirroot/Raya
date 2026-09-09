'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Upload, X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useCategories, useUploadQuestion } from '@/lib/question-bank/hooks/useQuestions';

export default function QuestionUploadPage() {
  const router = useRouter();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const uploadMutation = useUploadQuestion();

  // ===== Check auth =====
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login?redirect=/question-bank/upload');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceType, setPriceType] = useState<'free' | 'paid'>('free');
  const [price, setPrice] = useState('');
  const [teacher, setTeacher] = useState('');

  // ===== Safe categories array =====
  const safeCategories = Array.isArray(categories) ? categories : [];

  // ===== Loading auth =====
  if (isAuthenticated === null) {
    return (
      <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Container>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('لطفاً فایل را انتخاب کنید');
      return;
    }

    // ✅ چک کن فایل خالی نباشه
    if (file.size === 0) {
      alert('فایل خالی است. لطفاً فایل معتبری انتخاب کنید.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category_id', categoryId);
    formData.append('price_type', priceType);
    formData.append('price', price || '0');
    formData.append('teacher', teacher);
    formData.append('file', file);
    formData.append('file_name', file.name);
    formData.append('file_size', String(file.size));
    formData.append('file_mime_type', file.type || 'application/octet-stream');

    uploadMutation.mutate(formData);
  };

  // ===== Success =====
  if (uploadMutation.isSuccess) {
    return (
      <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/question-bank" className="btn btn-secondary rounded-[var(--radius)] p-2">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-black text-foreground">آپلود سوال</h1>
        </div>
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h2 className="mt-3 text-lg font-black text-foreground">سوال با موفقیت آپلود شد!</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            سوال شما پس از بررسی در بانک سوالات قرار می‌گیرد.
          </p>
          <Link href="/question-bank" className="btn btn-primary mt-4">
            بازگشت به بانک سوالات
          </Link>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/question-bank" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-foreground">آپلود سوال جدید</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-foreground-muted">عنوان سوال *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان سوال را وارد کنید"
              className="input mt-1 text-sm"
              required
            />
          </div>

          {/* Teacher */}
          <div>
            <label className="text-xs font-bold text-foreground-muted">نام مدرس</label>
            <input
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="نام مدرس را وارد کنید"
              className="input mt-1 text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-foreground-muted">دسته‌بندی *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input mt-1 text-sm"
              required
            >
              <option value="">انتخاب دسته‌بندی</option>
              {categoriesLoading ? (
                <option disabled>در حال بارگذاری...</option>
              ) : (
                safeCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Price Type */}
          <div>
            <label className="text-xs font-bold text-foreground-muted">نوع قیمت *</label>
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value as 'free' | 'paid')}
              className="input mt-1 text-sm"
              required
            >
              <option value="free">رایگان</option>
              <option value="paid">پولی</option>
            </select>
          </div>

          {/* Price (if paid) */}
          {priceType === 'paid' && (
            <div>
              <label className="text-xs font-bold text-foreground-muted">قیمت (تومان) *</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min="1000"
                step="1000"
                placeholder="قیمت را وارد کنید (حداقل ۱۰۰۰ تومان)"
                className="input mt-1 text-sm"
                required
              />
              <p className="mt-1 text-[10px] text-foreground-muted">هر ۱۰۰۰ تومان = ۱ سکه</p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-foreground-muted">توضیحات *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات کامل سوال را وارد کنید..."
              className="input mt-1 min-h-[120px] text-sm resize-y"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="text-xs font-bold text-foreground-muted">فایل سوال *</label>
            <div className="mt-1">
              {file ? (
                <div className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-foreground-muted">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <span className="text-[10px] text-foreground-muted/60">
                    {file.type || 'unknown'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="rounded-full p-1 hover:bg-background-subtle"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-border p-6 transition-all hover:border-primary">
                  <Upload className="h-8 w-8 text-foreground-muted" />
                  <p className="mt-2 text-sm text-foreground-muted">فایل خود را آپلود کنید</p>
                  <p className="text-xs text-foreground-muted/60">
                    PDF, Word, Excel, PowerPoint, ZIP, TXT, و ...
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="btn btn-primary w-full text-sm"
          >
            {uploadMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال آپلود...
              </span>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                آپلود سوال
              </>
            )}
          </button>

          {uploadMutation.isError && (
            <p className="text-xs text-error text-center">
              خطا در آپلود سوال. لطفاً دوباره تلاش کنید.
            </p>
          )}
        </form>
      </Card>
    </Container>
  );
}
