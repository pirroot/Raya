import type { AxiosError } from 'axios';

// ===== Types =====
interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
  errors?: Record<string, string[]>;
  detail?: string;
  code?: string;
}

// ===== Constants =====
const AUTH_ERROR_PATTERNS = [
  'auth',
  'unauthor',
  'forbidden',
  'jwt',
  'token',
  'session',
  'expired',
  'login',
  'credential',
  'کاربر یافت نشد',
  'احراز هویت',
];

// ===== Helpers =====
function normalizePayloadMessage(message: ApiErrorPayload['message']): string {
  if (Array.isArray(message)) {
    return message.join(' ');
  }
  return typeof message === 'string' ? message : '';
}

function getFirstMessage(messages: string[]): string {
  return messages[0] || '';
}

// ===== Main =====
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErrorPayload>;
  const data = axiosError?.response?.data;

  // Try different fields in order
  if (data) {
    if (Array.isArray(data.message) && data.message.length > 0) {
      return getFirstMessage(data.message);
    }

    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }

    if (typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }

    if (data.errors && typeof data.errors === 'object') {
      const firstError = Object.values(data.errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
      if (typeof firstError === 'string') {
        return firstError;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function isAuthError(error: unknown): boolean {
  // ===== اضافه کردن چک برای null/undefined =====
  if (!error) return false;

  const axiosError = error as AxiosError<ApiErrorPayload>;
  const status = Number(axiosError?.response?.status);
  const data = axiosError?.response?.data;

  // Direct auth status codes
  if (status === 401 || status === 403) {
    return true;
  }

  // Check for auth-related messages
  const message = normalizePayloadMessage(data?.message).trim().toLowerCase();
  const errorMsg = (data?.error || '').toLowerCase();
  const detail = (data?.detail || '').toLowerCase();

  if (status === 400) {
    return AUTH_ERROR_PATTERNS.some(
      (pattern) =>
        message.includes(pattern) || errorMsg.includes(pattern) || detail.includes(pattern)
    );
  }

  // Check for auth error codes
  if (data?.code && typeof data.code === 'string') {
    const authCodes = ['token_invalid', 'token_expired', 'auth_required'];
    return authCodes.includes(data.code);
  }

  return false;
}
