import axios from 'axios';
import type { AiSession, AiSendLimitError } from '@/lib/aiClient';
import type { UiMessage } from './types';

export const DRAFT_SETTINGS_SESSION_ID = 'draft-session';

export const numberFormatter = new Intl.NumberFormat('fa-IR');

export function getSessionTitle(session: AiSession, messages: UiMessage[]) {
  const trimmed = session.title?.trim() || '';
  const genericTitles = ['گفتگوی جدید', 'new chat'];

  if (trimmed && !genericTitles.includes(trimmed.toLowerCase())) {
    return trimmed;
  }

  const firstUserMessage = messages.find((m) => m.role === 'USER');
  if (!firstUserMessage?.content?.trim()) {
    return trimmed || 'New chat';
  }

  const words = firstUserMessage.content
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 5)
    .join(' ');

  return words || trimmed || 'New chat';
}

export function getAiSendLimitError(error: unknown): AiSendLimitError | null {
  if (!axios.isAxiosError(error)) return null;
  return (error.response?.data ?? null) as AiSendLimitError | null;
}

export function formatWindowEndTime(value?: string | null) {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDistanceToNow(date: string | Date) {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear > 0) return `${diffYear} سال پیش`;
  if (diffMonth > 0) return `${diffMonth} ماه پیش`;
  if (diffDay > 0) return `${diffDay} روز پیش`;
  if (diffHour > 0) return `${diffHour} ساعت پیش`;
  if (diffMin > 0) return `${diffMin} دقیقه پیش`;
  if (diffSec > 10) return `${diffSec} ثانیه پیش`;
  return 'لحظاتی پیش';
}

export function formatNotificationTime(date: string | Date) {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'همین الان';
  if (diffMin < 60) return `${diffMin} دقیقه پیش`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ساعت پیش`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} روز پیش`;

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(past);
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('fa-IR').format(amount);
}

export function formatCoin(amount: number) {
  return new Intl.NumberFormat('fa-IR').format(amount);
}

export function truncateText(text: string, maxLength: number = 50) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
