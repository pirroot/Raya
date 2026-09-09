'use client';

import api, { API_ENDPOINTS } from '@/lib/api';

// ===== Types =====
export interface AuthSessionState {
  authenticated: boolean;
  otpPending: boolean;
  registrationPending: boolean;
  registrationStep: 'profile' | 'education' | null;
  user?: {
    id: string;
    mobile: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
}

// ===== Constants =====
const AUTH_SESSION_CACHE_TTL_MS = 12_000;

const DEFAULT_AUTH_SESSION_STATE: AuthSessionState = {
  authenticated: false,
  otpPending: false,
  registrationPending: false,
  registrationStep: null,
  user: null,
};

// ===== State =====
interface CachedSession {
  value: AuthSessionState;
  expiresAt: number;
}

let cachedSession: CachedSession | null = null;
let inFlightRequest: Promise<AuthSessionState> | null = null;

// ===== Helpers =====
function isCacheValid(cache: CachedSession | null): boolean {
  return cache !== null && cache.expiresAt > Date.now();
}

function createCachedSession(session: AuthSessionState): CachedSession {
  return {
    value: session,
    expiresAt: Date.now() + AUTH_SESSION_CACHE_TTL_MS,
  };
}

// ===== Public API =====
export function resetAuthFlowState(): void {
  cachedSession = null;
  inFlightRequest = null;
}

export async function logoutAuthSession(): Promise<void> {
  try {
    await api.post(API_ENDPOINTS.AUTH.LOGOUT);
  } catch {
    // Silently fail
  } finally {
    localStorage.removeItem('access_token');
    document.cookie = 'access_token=; path=/; max-age=0';
    document.cookie = 'refresh_token=; path=/; max-age=0';
    sessionStorage.removeItem('dev_otp_code');
    sessionStorage.removeItem('dev_mobile');
    resetAuthFlowState();
  }
}

export async function fetchAuthSession(): Promise<AuthSessionState> {
  if (isCacheValid(cachedSession)) {
    return cachedSession!.value;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = fetchSessionFromServer();

  try {
    const session = await inFlightRequest;
    cachedSession = createCachedSession(session);
    return session;
  } finally {
    inFlightRequest = null;
  }
}

// ===== Private =====
async function fetchSessionFromServer(): Promise<AuthSessionState> {
  try {
    // Try to get current user info
    const response = await api.get(API_ENDPOINTS.USERS.ME);

    if (response.data) {
      return {
        authenticated: true,
        otpPending: false,
        registrationPending: false,
        registrationStep: null,
        user: response.data,
      };
    }

    return DEFAULT_AUTH_SESSION_STATE;
  } catch (error) {
    // Check if it's a 401, meaning not authenticated
    const status = (error as any)?.response?.status;
    if (status === 401) {
      return DEFAULT_AUTH_SESSION_STATE;
    }

    // For other errors, return cached or default
    return DEFAULT_AUTH_SESSION_STATE;
  }
}
