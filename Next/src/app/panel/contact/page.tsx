'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Send, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !message.trim()) return;

    setLoading(true);
    setError('');
    try {
      await api.post(API_ENDPOINTS.CONTACT.CREATE, {
        name: name.trim(),
        mobile: mobile.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setName('');
      setMobile('');
      setMessage('');
    } catch (err) {
      setError('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-black text-foreground">تماس با ما</h1>
      </div>

      <Card className="p-4">
        <p className="mb-4 text-sm text-foreground-muted">
          پیام خود را برای ما ارسال کنید. در اسرع وقت پاسخ خواهیم داد.
        </p>

        {success ? (
          <div className="rounded-[var(--radius)] bg-success/10 p-4 text-center">
            <p className="text-sm font-bold text-success">✅ پیام شما با موفقیت ارسال شد</p>
            <p className="mt-1 text-xs text-foreground-muted">به زودی با شما تماس می‌گیریم</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="نام و نام خانوادگی"
              className="input h-11 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="شماره موبایل"
              className="input h-11 text-sm"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
            <textarea
              placeholder="پیام شما..."
              className="input min-h-32 text-sm resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            {error && <p className="text-xs text-error">{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              ارسال پیام
            </button>
          </form>
        )}
      </Card>
    </Container>
  );
}
