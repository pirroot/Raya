// lib/csrf.ts
import { CSRF_COOKIE, CSRF_HEADER } from '@/lib/csrf-constants';
import axios from 'axios';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';').map((c) => c.trim());
  const found = cookies.find((c) => c.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.slice(name.length + 1));
}

export function getCsrfTokenFromCookie(): string | null {
  return getCookie(CSRF_COOKIE);
}

let inFlightCsrfRequest: Promise<string> | null = null;

export async function ensureCsrfToken(): Promise<string> {
  const currentToken = getCsrfTokenFromCookie();
  if (currentToken) return currentToken;

  if (inFlightCsrfRequest) {
    return inFlightCsrfRequest;
  }

  inFlightCsrfRequest = fetchCsrfToken();

  try {
    return await inFlightCsrfRequest;
  } finally {
    inFlightCsrfRequest = null;
  }
}

export async function withCsrfHeaders(headers?: HeadersInit): Promise<Headers> {
  const token = await ensureCsrfToken();
  const nextHeaders = new Headers(headers ?? {});
  nextHeaders.set(CSRF_HEADER, token);
  return nextHeaders;
}

async function fetchCsrfToken(): Promise<string> {
  try {
    const csrfApi = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
      withCredentials: true,
    });

    const response = await csrfApi.get('/auth/csrf/');
    if (response.data?.csrf_token) {
      return response.data.csrf_token;
    }
    const token = getCsrfTokenFromCookie();
    if (token) return token;
    throw new Error('CSRF token not found');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('CSRF token fetch failed, using fallback for development');
      return 'dev-csrf-token-' + Date.now();
    }
    throw new Error('Unable to initialize CSRF protection');
  }
}
