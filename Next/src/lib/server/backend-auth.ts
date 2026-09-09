import { NextRequest } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth-constants';
import { buildBackendUrl, buildInternalApiUrl } from '@/lib/server/backend';
import type { AuthTokenPayload } from '@/lib/server/auth-cookies';

// ===== Types =====
interface BackendRequestOptions {
  method: string;
  backendPath: string;
  search?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
  skipRefresh?: boolean;
}

interface BackendAuthResult {
  backendResponse: Response;
  refreshedSession?: AuthTokenPayload;
  clearSessionCookies: boolean;
}

// ===== Constants =====
const FORBIDDEN_HEADERS = [
  'host',
  'cookie',
  'connection',
  'content-length',
  'content-encoding',
  'transfer-encoding',
];

// ===== Main =====
export async function callBackendWithRefresh(
  request: NextRequest,
  options: BackendRequestOptions
): Promise<BackendAuthResult> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const backendResponse = await callBackend(request, options, accessToken);

  // No auth failure or refresh not needed
  if (backendResponse.status !== 401 || options.skipRefresh || !refreshToken) {
    return {
      backendResponse,
      clearSessionCookies: backendResponse.status === 401,
    };
  }

  // Try to refresh session
  const refreshedSession = await refreshSession(request, refreshToken);

  if (!refreshedSession) {
    return {
      backendResponse,
      clearSessionCookies: true,
    };
  }

  // Retry with new token
  const retriedResponse = await callBackend(
    request,
    options,
    refreshedSession.access_token
  );

  return {
    backendResponse: retriedResponse,
    refreshedSession,
    clearSessionCookies: retriedResponse.status === 401,
  };
}

// ===== Backend Call =====
async function callBackend(
  request: NextRequest,
  options: BackendRequestOptions,
  accessToken?: string
): Promise<Response> {
  const headers = buildHeaders(request, options.headers, accessToken);
  const url = buildInternalApiUrl(options.backendPath, options.search || '');

  return fetch(url, {
    method: options.method,
    headers,
    body: options.body,
    cache: 'no-store',
  });
}

// ===== Refresh Session =====
async function refreshSession(
  request: NextRequest,
  refreshToken: string
): Promise<AuthTokenPayload | null> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': request.headers.get('user-agent') || 'hoshyar-pwa',
      'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
      'x-device-id': request.headers.get('x-device-id') || '',
    };

    const response = await fetch(buildBackendUrl('auth/refresh'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as AuthTokenPayload;

    if (!payload?.access_token || !payload?.refresh_token) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ===== Helpers =====
function buildHeaders(
  request: NextRequest,
  customHeaders?: HeadersInit,
  accessToken?: string
): Headers {
  const headers = new Headers(customHeaders ?? request.headers);

  // Remove forbidden headers
  FORBIDDEN_HEADERS.forEach((header) => headers.delete(header));

  // Set or remove Authorization
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else {
    headers.delete('Authorization');
  }

  return headers;
}
