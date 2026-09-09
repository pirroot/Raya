'use client';

import Link from 'next/link';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useConversations, useUnreadCount } from '@/lib/api/hooks/useChat';

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'همین الان';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`;
  return date.toLocaleDateString('fa-IR');
}

export default function ChatsPage() {
  const { data, isLoading, isError } = useConversations();
  const { data: unreadCount } = useUnreadCount();

  const conversations = data?.items || [];

  if (isLoading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="py-8 text-center">
        <p className="text-error">خطا در دریافت مکالمات</p>
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      {/* ===== Header ===== */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/panel" className="btn btn-secondary rounded-(--radius) p-2">
            <ArrowRight className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-black text-foreground">پیام‌ها</h1>
          {unreadCount > 0 && (
            <span className="badge bg-error/10 text-error text-xs">{unreadCount} جدید</span>
          )}
        </div>
        <MessageSquare className="h-5 w-5 text-foreground-muted" />
      </div>

      {/* ===== لیست مکالمات ===== */}
      <div className="space-y-2.5">
        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-foreground-muted/30" />
            <p className="mt-2 text-sm font-bold text-foreground-muted">پیامی وجود ندارد</p>
            <p className="text-xs text-foreground-muted/60">
              با ثبت سفارش، می‌توانید با فروشنده در ارتباط باشید
            </p>
          </Card>
        ) : (
          conversations.map((conv) => {
            const otherUser = conv.participants.find((p: any) => p.id !== 'current_user_id');
            const hasUnread = conv.unread_count > 0;

            return (
              <Link key={conv.id} href={`/panel/chats/${conv.id}`} className="block">
                <Card
                  className={`p-3 transition-all hover:shadow-(--shadow-lg) ${
                    hasUnread ? 'border-r-4 border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* ===== آواتار ===== */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      {otherUser?.full_name?.charAt(0)?.toUpperCase() || '👤'}
                    </div>

                    {/* ===== اطلاعات ===== */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black text-foreground">
                          {otherUser?.full_name || 'کاربر ناشناس'}
                        </p>
                        <span className="text-[9px] text-foreground-muted/60 whitespace-nowrap">
                          {formatTimeAgo(conv.last_message_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-foreground-muted">
                        {conv.last_message || 'بدون پیام'}
                      </p>
                    </div>

                    {/* ===== تعداد نخوانده ===== */}
                    {hasUnread && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </Container>
  );
}
