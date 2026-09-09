'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, Megaphone, Calendar, Pin } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import api, { API_ENDPOINTS } from '@/lib/api';

// ===== Types =====
interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  is_pinned: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.ANNOUNCEMENTS.LIST);
        const data = Array.isArray(response.data?.results) ? response.data.results : [];
        setAnnouncements(data);
      } catch (error) {
        console.error('Error loading announcements:', error);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-black text-foreground">اطلاعیه‌ها</h1>
      </div>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <Card className="p-8 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-foreground-muted/30" />
            <p className="mt-2 text-sm font-bold text-foreground-muted">اطلاعیه‌ای وجود ندارد</p>
          </Card>
        ) : (
          announcements.map((item) => (
            <Card
              key={item.id}
              className={`p-4 ${item.is_pinned ? 'border-r-4 border-primary' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary">
                  {item.is_pinned ? <Pin className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-foreground">{item.title}</p>
                    {item.is_pinned && (
                      <span className="badge bg-primary/10 text-primary text-[8px]">مهم</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-foreground-muted leading-5">{item.content}</p>
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-foreground-muted">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.date)}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Container>
  );
}
