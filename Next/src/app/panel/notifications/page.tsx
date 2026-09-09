'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Megaphone,
  ShoppingBag,
  Award,
  Wallet,
  Coins,
  MessageSquare,
  Trash2,
  Check,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import {
  useNotifications,
  useMarkAllAsRead,
  useDeleteNotification,
  useMarkAsRead,
} from '@/lib/api/hooks/useNotifications';
import { formatDistanceToNow } from '@/lib/aiUnitl/ai_utilities';
import toast from 'react-hot-toast';

type NotificationType = 'order' | 'ad' | 'certificate' | 'wallet' | 'coins' | 'message' | 'system';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

const typeConfig: Record<
  NotificationType,
  { icon: any; bg: string; color: string; label: string }
> = {
  order: {
    icon: ShoppingBag,
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    color: 'text-orange-500',
    label: 'سفارش',
  },
  ad: {
    icon: Megaphone,
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    color: 'text-cyan-500',
    label: 'آگهی',
  },
  certificate: {
    icon: Award,
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    color: 'text-rose-500',
    label: 'گواهی',
  },
  wallet: {
    icon: Wallet,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    color: 'text-emerald-500',
    label: 'کیف پول',
  },
  coins: {
    icon: Coins,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    color: 'text-amber-500',
    label: 'سکه',
  },
  message: {
    icon: MessageSquare,
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    color: 'text-blue-500',
    label: 'پیام',
  },
  system: {
    icon: Bell,
    bg: 'bg-slate-50 dark:bg-slate-800/30',
    color: 'text-slate-500',
    label: 'سیستم',
  },
};

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date);
  } catch {
    return dateString;
  }
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useNotifications();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: markAsRead } = useMarkAsRead();

  const notifications = data?.items || [];
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n: Notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const handleMarkAllAsRead = () => {
    markAllAsRead(undefined, {
      onSuccess: () => {
        toast.success('همه اعلان‌ها خوانده شدند');
        refetch();
      },
      onError: () => {
        toast.error('خطا در علامت‌گذاری اعلان‌ها');
      },
    });
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id, {
      onSuccess: () => {
        toast.success('اعلان خوانده شد');
        refetch();
      },
      onError: () => {
        toast.error('خطا در علامت‌گذاری');
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این اعلان مطمئن هستید؟')) {
      deleteNotification(id, {
        onSuccess: () => {
          toast.success('اعلان حذف شد');
          refetch();
        },
        onError: () => {
          toast.error('خطا در حذف اعلان');
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/panel"
            className="btn btn-secondary rounded-[var(--radius)] p-2 hover:scale-105 transition-all"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-black text-foreground">اعلان‌ها</h1>
          {unreadCount > 0 && (
            <span className="badge bg-error/10 text-error text-xs animate-pulse">
              {unreadCount} جدید
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            همه را خوانده شد
          </button>
        )}
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { value: 'all', label: 'همه', count: notifications.length },
          { value: 'unread', label: 'خوانده نشده', count: unreadCount },
          { value: 'read', label: 'خوانده شده', count: notifications.length - unreadCount },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              filter === tab.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-background-subtle text-foreground-muted hover:bg-background-subtle/80'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-background-subtle p-4">
                <Bell className="h-10 w-10 text-foreground-muted/30" />
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-foreground-muted">اعلانی وجود ندارد</p>
            <p className="text-xs text-foreground-muted/60">
              اعلان‌های شما اینجا نمایش داده می‌شود
            </p>
          </Card>
        ) : (
          filteredNotifications.map((notification: Notification) => {
            const Icon = typeConfig[notification.type]?.icon || Bell;
            const iconBg = typeConfig[notification.type]?.bg || 'bg-slate-50 dark:bg-slate-800/30';
            const iconColor = typeConfig[notification.type]?.color || 'text-slate-500';
            const typeLabel = typeConfig[notification.type]?.label || 'سیستم';

            return (
              <Card
                key={notification.id}
                className={`group p-3 transition-all hover:shadow-[var(--shadow-lg)] ${
                  !notification.isRead
                    ? 'border-r-4 border-r-primary bg-primary/5'
                    : 'hover:bg-background-subtle/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`truncate text-sm font-black ${
                              !notification.isRead ? 'text-foreground' : 'text-foreground-muted'
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-foreground-muted leading-5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[9px] text-foreground-muted/60 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                        <span className="text-[9px] font-bold text-foreground-muted/40">
                          {typeLabel}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-bold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Check className="h-2.5 w-2.5" />
                          خوانده شد
                        </button>
                      )}

                      {notification.link && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <Link
                            href={notification.link}
                            className="text-[9px] font-bold text-primary hover:text-primary-hover transition-colors"
                          >
                            مشاهده
                          </Link>
                        </>
                      )}

                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="mr-auto rounded-full p-0.5 text-foreground-muted/40 hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="حذف اعلان"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Container>
  );
}
