// src/app/messages/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MessageSquare, User } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useConversations } from '@/lib/api/hooks/useMessages';
import { isAuthError } from '@/lib/api-error';

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'چند لحظه پیش';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`;
  return date.toLocaleDateString('fa-IR');
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const receiverId = searchParams.get('receiver');

  const { data: conversations = [], isLoading, error } = useConversations();

  // ===== اگر receiverId داشت، شروع مکالمه جدید =====
  useEffect(() => {
    if (receiverId) {
      // بررسی کن که آیا مکالمه با این کاربر وجود داره
      const existingConversation = conversations.find((conv) => conv.other_user?.id === receiverId);

      if (existingConversation) {
        router.replace(`/messages/${existingConversation.id}`);
      } else {
        // اگر مکالمه وجود نداشت، به صفحه چت با receiverId برو
        router.replace(`/messages/${receiverId}`);
      }
    }
  }, [receiverId, conversations, router]);

  if (isAuthError(error)) {
    router.replace('/auth/mobile');
    return null;
  }

  if (isLoading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/panel" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-black text-foreground">پیام‌ها</h1>
      </div>

      <div className="space-y-3">
        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-foreground-muted/30" />
            <p className="mt-2 text-sm font-bold text-foreground-muted">پیامی وجود ندارد</p>
            <p className="text-xs text-foreground-muted/60">با کاربران دیگر ارتباط برقرار کنید</p>
          </Card>
        ) : (
          conversations.map((conv) => (
            <Link key={conv.id} href={`/messages/${conv.id}`} className="block">
              <Card
                className={`p-4 transition-all hover:shadow-[var(--shadow-lg)] ${conv.unread_count > 0 ? 'border-r-4 border-primary' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-foreground truncate">
                        {conv.other_user?.first_name || 'کاربر'}
                      </p>
                      <span className="text-[10px] text-foreground-muted">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-foreground-muted truncate">
                      {conv.last_message || 'شروع مکالمه'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </Container>
  );
}
