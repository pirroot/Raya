'use client';
import Link from 'next/link';
import { ArrowLeft, Coins, Settings2, Menu, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface ChatHeaderProps {
  userCard?: { firstName?: string } | null;
  balance?: { balance?: number | string } | null;
  limitChip?: string | null;
  activeSession?: any;
  activeMessages?: any[];
  getSessionTitle: (session: any, messages: any[]) => string;
  setAccountMenuOpen: (updater: (current: boolean) => boolean) => void;
  accountMenuOpen?: boolean;
  setSettingsOpen?: (open: boolean) => void;
  onOpenSidebar?: () => void;
  isBalanceLoading?: boolean;
}

export default function ChatHeader({
  userCard,
  balance,
  limitChip,
  activeSession,
  activeMessages = [],
  getSessionTitle,
  setAccountMenuOpen,
  accountMenuOpen,
  setSettingsOpen,
  onOpenSidebar,
  isBalanceLoading = false,
}: ChatHeaderProps) {
  return (
    <div className="border-b border-border bg-card px-3 pb-3 pt-3 sm:px-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              aria-label="باز کردن منوی گفتگوها"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-foreground-muted transition-colors hover:bg-background-subtle hover:text-foreground active:scale-95 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setAccountMenuOpen((c) => !c)}
            aria-expanded={accountMenuOpen}
            className={`
              flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border
              text-sm font-bold text-foreground transition-colors
              hover:bg-background-subtle active:scale-95
              ${accountMenuOpen ? 'bg-primary-soft border-primary/30 text-primary-text' : 'bg-background'}
            `}
          >
            {userCard?.firstName?.charAt(0) || '?'}
          </button>

          <Link
            href="/"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-2xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-background-subtle active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">خانه</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground">
            <Coins className="h-3 w-3 text-warning" />
            {isBalanceLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span>{balance?.balance ?? 0} سکه</span>
            )}
          </div>

          {setSettingsOpen && (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="تنظیمات"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-foreground-muted transition-colors hover:bg-background-subtle hover:text-foreground active:scale-95"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <h1 className="mt-2.5 truncate text-sm font-black text-foreground">
        {activeSession ? getSessionTitle(activeSession, activeMessages) : 'گفتگوی جدید'}
      </h1>
    </div>
  );
}
