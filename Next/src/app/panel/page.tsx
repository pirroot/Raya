'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  BookOpen,
  Wallet,
  Coins,
  UserCircle2,
  ShoppingBag,
  Award,
  Megaphone,
  Settings,
  Info,
  Bell,
  Mail,
  Shield,
  LayoutDashboard,
  MessageSquare,
} from 'lucide-react';
import api, { resolveBackendUrl, API_ENDPOINTS } from '@/lib/api';
import { isAuthError } from '@/lib/api-error';
import { logoutAuthSession } from '@/lib/auth-flow';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useWalletOverview } from '@/lib/api/hooks/useWallet';
import { useCoinsBalance } from '@/lib/api/hooks/useCoins';
import { useMyProducts } from '@/lib/market/useMarket';
import { useOrders } from '@/lib/market/useMarket';
import { useQueryClient } from '@tanstack/react-query';
// import { UnreadBadge } from '@/components/UnreadBadge';

const coinFormatter = new Intl.NumberFormat('fa-IR');

type UserStatus =
  | 'online'
  | 'busy'
  | 'chill'
  | 'resting'
  | 'studying'
  | 'gaming'
  | 'coffee'
  | 'music'
  | 'coding';

type UserProfile = {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string | null;
  status?: UserStatus;
  bio?: string;
  id?: string;
  isTeacher?: boolean;
  isStaff?: boolean;
};

const statusMap: Record<UserStatus, { label: string; emoji: string; color: string; dot: string }> =
  {
    online: { label: 'آنلاین', emoji: '🟢', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    busy: { label: 'مشغول', emoji: '🔴', color: 'text-rose-400', dot: 'bg-rose-400' },
    chill: { label: 'چیل', emoji: '😎', color: 'text-amber-400', dot: 'bg-amber-400' },
    resting: { label: 'استراحت', emoji: '😴', color: 'text-blue-400', dot: 'bg-blue-400' },
    studying: { label: 'در حال مطالعه', emoji: '📚', color: 'text-blue-500', dot: 'bg-blue-500' },
    gaming: { label: 'گیم', emoji: '🎮', color: 'text-purple-400', dot: 'bg-purple-400' },
    coffee: { label: 'کافه', emoji: '☕', color: 'text-amber-600', dot: 'bg-amber-600' },
    music: { label: 'موزیک', emoji: '🎵', color: 'text-pink-400', dot: 'bg-pink-400' },
    coding: { label: 'کد زدن', emoji: '💻', color: 'text-cyan-400', dot: 'bg-cyan-400' },
  };

const menuItems = [
  {
    icon: UserCircle2,
    label: 'پروفایل من',
    href: '/panel/profile',
    color: 'text-menu-blue',
    bg: 'bg-menu-blue-soft',
  },
  {
    icon: Wallet,
    label: 'کیف پول',
    href: '/panel/wallet',
    color: 'text-menu-emerald',
    bg: 'bg-menu-emerald-soft',
  },
  {
    icon: Coins,
    label: 'سکه‌ها',
    href: '/panel/coins',
    color: 'text-menu-amber',
    bg: 'bg-menu-amber-soft',
  },
  {
    icon: ShoppingBag,
    label: 'سفارش‌ها',
    href: '/panel/orders',
    color: 'text-menu-orange',
    bg: 'bg-menu-orange-soft',
  },
  {
    icon: BookOpen,
    label: 'دوره‌های من',
    href: '/panel/my-courses',
    color: 'text-menu-purple',
    bg: 'bg-menu-purple-soft',
  },
  {
    icon: Award,
    label: 'گواهی‌ها',
    href: '/panel/certificates',
    color: 'text-menu-rose',
    bg: 'bg-menu-rose-soft',
  },
  {
    icon: Megaphone,
    label: 'آگهی‌های من',
    href: '/panel/my-ads',
    color: 'text-menu-cyan',
    bg: 'bg-menu-cyan-soft',
  },
  {
    icon: Settings,
    label: 'تنظیمات',
    href: '/panel/settings',
    color: 'text-foreground-muted',
    bg: 'bg-background-subtle',
  },
  {
    icon: Info,
    label: 'درباره‌ما',
    href: '/panel/about',
    color: 'text-menu-indigo',
    bg: 'bg-menu-indigo-soft',
  },
  {
    icon: Mail,
    label: 'تماس با ما',
    href: '/panel/contact',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
];

export default function PanelPage() {
  const router = useRouter();
  // const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotif, setIsNotif] = useState(true);

  const {
    data: walletData,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useWalletOverview();

  const { data: coinsData, isLoading: coinsLoading, refetch: refetchCoins } = useCoinsBalance();

  const { data: myAds, isLoading: adsLoading } = useMyProducts();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();

  const adsCount = myAds?.items?.length || 0;
  const ordersCount = ordersData?.items?.length || 0;

  const quickStats = [
    { label: 'دوره‌ها', value: '۰', icon: BookOpen, color: 'text-purple-500' },
    { label: 'گواهی‌ها', value: '۰', icon: Award, color: 'text-rose-500' },
    {
      label: 'آگهی‌ها',
      value: adsLoading ? '...' : adsCount,
      icon: Megaphone,
      color: 'text-cyan-500',
    },
    {
      label: 'سفارش‌ها',
      value: ordersLoading ? '...' : ordersCount,
      icon: ShoppingBag,
      color: 'text-orange-500',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      refetchWallet();
      refetchCoins();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetchWallet, refetchCoins]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.USERS.PROFILE, { timeout: 8000 });
        const profile = response.data;

        setUser({
          id: profile?.id,
          firstName: profile?.first_name || profile?.firstName || 'کاربر',
          lastName: profile?.last_name || profile?.lastName || 'عزیز',
          username: profile?.username || profile?.user_name || 'بدون نام کاربری',
          avatarUrl: resolveBackendUrl(profile?.avatarUrl || profile?.avatar_url || null),
          status: profile?.status || 'online',
          bio: profile?.bio || 'دانشجوی مهندسی کامپیوتر',
          isTeacher: profile?.is_teacher || false,
          isStaff: profile?.is_staff || false,
        });
      } catch (error) {
        if (isAuthError(error)) {
          router.replace('/auth/mobile');
          return;
        }
        setUser({
          firstName: 'کاربر',
          lastName: 'عزیز',
          username: 'بدون نام کاربری',
          status: 'online',
          bio: 'به رایا خوش آمدید',
          isTeacher: false,
          isStaff: false,
        });
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  const handleLogout = async () => {
    await logoutAuthSession();
    router.replace('/');
  };

  const handleRefresh = () => {
    refetchWallet();
    refetchCoins();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const statusInfo = user?.status ? statusMap[user.status] : statusMap.online;
  const walletBalance = walletData?.balance ?? 0;
  const coinsBalance = coinsData?.balance ?? 0;
  const showAdminPanel = user?.isTeacher || user?.isStaff;

  return (
    <main>
      <Container className="pb-28 pt-4 lg:pb-16 lg:pt-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground">پنل کاربری</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="btn btn-secondary rounded-[var(--radius)] p-2 text-xs"
              disabled={walletLoading || coinsLoading}
            >
              {walletLoading || coinsLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                '🔄'
              )}
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-secondary rounded-[var(--radius)] px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </button>
          </div>
        </div>

        <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-secondary p-5 text-white shadow-[var(--shadow-lg)]">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/5" />

          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-black text-white ring-4 ring-white/30">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.firstName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  user?.firstName?.charAt(0)?.toUpperCase() || '👤'
                )}
              </div>
              <span
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${statusInfo.dot}`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black truncate">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-white/80 truncate">@{user?.username}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold backdrop-blur-sm">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                  {statusInfo.emoji} {statusInfo.label}
                </span>
                {showAdminPanel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/30 px-2 py-0.5 text-xs font-bold backdrop-blur-sm">
                    <Shield className="h-3 w-3" />
                    استاد
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-white/70 truncate">{user?.bio}</p>
            </div>

            <div className="flex items-center gap-2">
              {/* <Link
                href="/panel/chats"
                className="shrink-0 relative rounded-full bg-white/20 p-2 backdrop-blur-sm transition hover:bg-white/30"
              >
                <MessageSquare className="h-5 w-5" />
                <UnreadBadge />
              </Link> */}

              <Link
                href="/panel/notifications"
                className="shrink-0 relative rounded-full bg-white/20 p-2 backdrop-blur-sm transition hover:bg-white/30"
              >
                <Bell className="h-5 w-5" />
                {isNotif && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
              </Link>
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/panel/wallet"
              className="rounded-[var(--radius)] bg-white/15 p-3 backdrop-blur-sm transition hover:bg-white/20"
            >
              <p className="text-xs text-white/70">کیف پول</p>
              <p className="text-xl font-black">
                {walletLoading ? (
                  <span className="inline-block h-6 w-20 animate-pulse rounded bg-white/20" />
                ) : (
                  `${coinFormatter.format(walletBalance)} تومان`
                )}
              </p>
            </Link>
            <Link
              href="/panel/coins"
              className="rounded-[var(--radius)] bg-white/15 p-3 backdrop-blur-sm transition hover:bg-white/20"
            >
              <p className="text-xs text-white/70">سکه‌ها</p>
              <p className="text-xl font-black">
                {coinsLoading ? (
                  <span className="inline-block h-6 w-20 animate-pulse rounded bg-white/20" />
                ) : (
                  `${coinFormatter.format(coinsBalance)} 🪙`
                )}
              </p>
            </Link>
          </div>
        </Card>

        {showAdminPanel && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/admin/"
              className="card flex items-center justify-center gap-2 p-4 transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-lg)] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
            >
              <LayoutDashboard className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                پنل مدیریت
              </span>
            </Link>
            <Link
              href="/admin/education/course/"
              className="card flex items-center justify-center gap-2 p-4 transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-lg)] bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
            >
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                مدیریت دوره‌ها
              </span>
            </Link>
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {quickStats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card flex flex-col items-center p-3 text-center">
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="mt-1 text-lg font-black text-foreground">{value}</span>
              <span className="text-[10px] font-bold text-foreground-muted">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {menuItems.map(({ icon: Icon, label, href, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="card flex flex-col items-center gap-2 p-4 text-center transition-all hover:scale-[1.02] hover:shadow-[var(--shadow-lg)]"
            >
              <div className={`rounded-[var(--radius-sm)] ${bg} p-2.5`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className="text-xs font-bold text-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </Container>
    </main>
  );
}
