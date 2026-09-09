'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, Award, Download, Share2, CheckCircle2, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';

interface Certificate {
  id: string;
  user_name: string;
  course_title: string;
  issued_at: string;
  is_verified: boolean;
  code: string;
  certificate_file: string;
  course?: {
    id: string;
    title: string;
  };
}

function toLocaleDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function CertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ===== Fetch certificates =====
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const response = await api.get(API_ENDPOINTS.CERTIFICATES.MY);

        let data = response.data;

        if (Array.isArray(data)) {
          // همونطور هست
        } else if (data && Array.isArray(data.results)) {
          data = data.results;
        } else if (data && Array.isArray(data.items)) {
          data = data.items;
        } else {
          data = [];
        }

        setCertificates(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError('خطا در دریافت گواهی‌ها');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  // ===== Download =====
  const handleDownload = (cert: Certificate) => {
    if (cert.certificate_file) {
      window.open(cert.certificate_file, '_blank');
    }
  };

  // ===== Share =====
  const handleShare = (cert: Certificate) => {
    const url = `${window.location.origin}/verify-certificate/${cert.code}`;
    if (navigator.share) {
      navigator
        .share({
          title: `گواهی ${cert.course_title}`,
          text: `گواهی پایان دوره ${cert.course_title}`,
          url: url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          alert('لینک گواهی کپی شد');
        })
        .catch(() => {});
    }
  };

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/panel" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-black text-foreground">گواهی‌های من</h1>
        <span className="badge badge-primary text-xs">{certificates.length}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-error">{error}</p>
        </Card>
      ) : certificates.length === 0 ? (
        <Card className="p-8 text-center">
          <Award className="mx-auto h-10 w-10 text-foreground-muted/30" />
          <p className="mt-2 text-sm font-bold text-foreground-muted">گواهی‌ای دریافت نکردید</p>
          <p className="text-xs text-foreground-muted/60">با گذراندن دوره‌ها، گواهی دریافت کنید</p>
          <Link href="/education" className="btn btn-primary mt-4">
            مشاهده دوره‌ها
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => (
            <Card key={cert.id} className="p-4 transition-all hover:shadow-[var(--shadow-lg)]">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius)] bg-amber-50 text-amber-500 dark:bg-amber-950/30">
                  <Award className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="truncate text-sm font-black text-foreground">
                        {cert.course_title || cert.course?.title || 'گواهی پایان دوره'}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {cert.user_name || 'کاربر عزیز'}
                      </p>
                    </div>
                    {cert.is_verified && (
                      <span className="badge bg-success/10 text-success text-[9px] shrink-0 flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                        تایید شده
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-foreground-muted">
                    تاریخ صدور: {toLocaleDate(cert.issued_at)}
                  </p>
                  <p className="mt-0.5 text-[9px] font-mono text-foreground-muted/60">
                    کد: {cert.code}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleDownload(cert)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary transition-all hover:bg-primary/20"
                    >
                      <Download className="h-3 w-3" />
                      دانلود
                    </button>
                    <button
                      onClick={() => handleShare(cert)}
                      className="inline-flex items-center gap-1 rounded-full bg-background-subtle px-3 py-1 text-[10px] font-bold text-foreground-muted transition-all hover:bg-background-subtle/80"
                    >
                      <Share2 className="h-3 w-3" />
                      اشتراک
                    </button>
                    <Link
                      href={`/verify-certificate/${cert.code}`}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600 transition-all hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400"
                    >
                      اعتبارسنجی
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
