'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Send, Lightbulb, ThumbsUp, Plus } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';
import { isAuthError } from '@/lib/api-error';

// ===== Types =====
interface Suggestion {
  id: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  is_liked: boolean;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ===== Constants =====
const statusLabels: Record<Suggestion['status'], { label: string; color: string }> = {
  pending: { label: 'در انتظار', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
  approved: {
    label: 'پذیرفته شده',
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  },
  rejected: { label: 'رد شده', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function SuggestionsPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // ===== Check Authentication =====
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/user/profile/');
        setIsAuthenticated(true);
      } catch (error) {
        if (isAuthError(error)) {
          router.replace('/auth/mobile');
          return;
        }
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [router]);

  // ===== Load Suggestions (only if authenticated) =====
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadSuggestions = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.SUGGESTIONS.LIST);
        // چون بک‌اند pagination داره، دیتا توی results هست
        const data = response.data?.results || [];
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        if (isAuthError(error)) {
          router.replace('/auth/mobile');
          return;
        }
        console.error('Error loading suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [isAuthenticated, router]);

  // ===== Submit Suggestion =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post(API_ENDPOINTS.SUGGESTIONS.CREATE, {
        title: title.trim(),
        content: content.trim(),
      });

      const newSuggestion = response.data;
      setSuggestions((prev) => [newSuggestion, ...prev]);
      setTitle('');
      setContent('');
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Like Suggestion =====
  const handleLike = async (id: string) => {
    try {
      const response = await api.post(API_ENDPOINTS.SUGGESTIONS.LIKE(id));
      const { likes, is_liked } = response.data;

      setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, likes, is_liked } : s)));
    } catch (error) {
      console.error('Error liking suggestion:', error);
    }
  };

  // ===== Loading =====
  if (loading || isAuthenticated === null) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="btn btn-secondary rounded-[var(--radius)] p-2">
            <ArrowRight className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-black text-foreground">پیشنهادات</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary rounded-[var(--radius)] px-3 py-1.5 text-xs"
        >
          <Plus className="h-4 w-4" />
          پیشنهاد جدید
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-4 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="عنوان پیشنهاد"
              className="input h-11 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="توضیحات پیشنهاد..."
              className="input min-h-24 text-sm resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'در حال ارسال...' : 'ارسال پیشنهاد'}
            </button>
          </form>
        </Card>
      )}

      {/* Suggestions */}
      <div className="space-y-3">
        {!Array.isArray(suggestions) || suggestions.length === 0 ? (
          <Card className="p-8 text-center">
            <Lightbulb className="mx-auto h-10 w-10 text-foreground-muted/30" />
            <p className="mt-2 text-sm font-bold text-foreground-muted">پیشنهادی وجود ندارد</p>
            <p className="text-xs text-foreground-muted/60">اولین پیشنهاد را شما ثبت کنید</p>
          </Card>
        ) : (
          suggestions.map((sug) => {
            const statusInfo = statusLabels[sug.status];
            return (
              <Card key={sug.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate text-sm font-black text-foreground">{sug.title}</p>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-foreground-muted">{sug.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-foreground-muted">
                      <span>{sug.author}</span>
                      <span>{formatDate(sug.created_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLike(sug.id)}
                    className={`shrink-0 rounded-full p-1.5 transition-colors ${
                      sug.is_liked
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-background-subtle text-foreground-muted'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="sr-only">لایک</span>
                    <span className="text-[10px] font-bold">{sug.likes > 0 ? sug.likes : ''}</span>
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Container>
  );
}
