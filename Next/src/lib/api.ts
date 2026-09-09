import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { CSRF_HEADER } from '@/lib/csrf-constants';
import { ensureCsrfToken } from '@/lib/csrf';

interface CacheEntry {
  timestamp: number;
  response: any;
}

interface RetryConfig extends AxiosRequestConfig {
  _retryTransient400Count?: number;
}

interface ErrorWithResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
      errors?: unknown;
    };
  };
  config?: {
    url?: string;
    method?: string;
    _retryTransient400Count?: number;
  };
  code?: string;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
})();

export function resolveBackendUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_ORIGIN) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

const CRITICAL_GET_CACHE_TTL_MS = 30_000;
const CRITICAL_URL_PATTERNS = ['/user/profile', '/ai/bootstrap', '/coins/balance', '/auth/session'];
const TRANSIENT_RETRY_MAX_ATTEMPTS = 4;
const TRANSIENT_RETRY_BASE_DELAY_MS = 120;

function isCriticalGetUrl(url: string): boolean {
  return CRITICAL_URL_PATTERNS.some((pattern) => url.includes(pattern));
}

function getCacheKey(config?: AxiosRequestConfig): string {
  return String(config?.url || '');
}

function isMutatingRequest(method: string = 'GET'): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

function isMeaningfulErrorPayload(payload: unknown): boolean {
  if (payload == null) return false;
  if (typeof payload === 'string') {
    const normalized = payload.trim().toLowerCase();
    return !!(normalized && normalized !== 'null' && normalized !== 'undefined');
  }
  if (typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    if (Object.keys(data).length === 0) return false;
    return 'message' in data || 'error' in data || 'errors' in data;
  }
  return false;
}

function shouldRetryTransientGet(error: ErrorWithResponse): boolean {
  const status = Number(error?.response?.status);
  const method = String(error?.config?.method || 'GET').toUpperCase();
  const retryCount = Number(error?.config?._retryTransient400Count || 0);
  const payload = error?.response?.data;
  const hasMeaningfulPayload = isMeaningfulErrorPayload(payload);
  const requestUrl = String(error?.config?.url || '');
  const isCritical = isCriticalGetUrl(requestUrl);
  const isNetworkFailure =
    !error?.response &&
    ['ECONNRESET', 'ECONNABORTED', 'ERR_NETWORK'].includes(String(error?.code || ''));
  return (
    (status === 400 || isNetworkFailure) &&
    method === 'GET' &&
    retryCount < TRANSIENT_RETRY_MAX_ATTEMPTS &&
    (!hasMeaningfulPayload || isCritical)
  );
}

const criticalGetCache = new Map<string, CacheEntry>();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ===== Variables for token refresh =====
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ===== Request Interceptor =====
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = String(config.method || 'GET').toUpperCase();
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);

  // ===== Authorization Token =====
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // ===== CSRF Token =====
  if (typeof window !== 'undefined' && !isSafeMethod) {
    try {
      const csrfToken = await ensureCsrfToken();
      config.headers.set(CSRF_HEADER, csrfToken);
    } catch (error) {
      console.warn('CSRF token fetch failed:', error);
    }
  }

  return config;
});

// ===== Response Interceptor =====
api.interceptors.response.use(
  (response) => {
    const method = String(response?.config?.method || 'GET').toUpperCase();
    const requestUrl = String(response?.config?.url || '');
    if (method === 'GET' && isCriticalGetUrl(requestUrl)) {
      criticalGetCache.set(getCacheKey(response.config), {
        timestamp: Date.now(),
        response,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const method = String(error?.config?.method || 'GET').toUpperCase();
    const requestUrl = String(error?.config?.url || '');
    const status = Number(error?.response?.status);

    // ===== Cache fallback for critical GETs =====
    if (method === 'GET' && isCriticalGetUrl(requestUrl) && [400, 502, 503].includes(status)) {
      const cached = criticalGetCache.get(getCacheKey(error?.config));
      if (cached && Date.now() - cached.timestamp <= CRITICAL_GET_CACHE_TTL_MS) {
        return { ...cached.response, config: error?.config };
      }
    }

    // ===== Retry transient 400 errors =====
    if (shouldRetryTransientGet(error as ErrorWithResponse)) {
      const config = error.config as RetryConfig;
      const retryConfig: RetryConfig = {
        ...config,
        _retryTransient400Count: (config?._retryTransient400Count || 0) + 1,
      };
      const delayMs = TRANSIENT_RETRY_BASE_DELAY_MS * (retryConfig._retryTransient400Count || 0);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return api.request(retryConfig);
    }

    // ===== Token Refresh on 401 =====
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await api.post(API_ENDPOINTS.AUTH.REFRESH, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        processQueue(null, newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.replace('/auth/mobile');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ===== Auto-logout on 401 (fallback) =====
    if (typeof window !== 'undefined' && status === 401) {
      const url = String(error?.config?.url || '');
      if (url.includes('/user/') || url.includes('/panel/')) {
        localStorage.removeItem('access_token');
        window.location.replace('/auth/mobile');
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export function resolveImageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/media/')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    const origin = new URL(baseUrl).origin;
    return `${origin}${path}`;
  }
  return path;
}

// ===== API Endpoints =====
export const API_ENDPOINTS = {
  USERS: {
    PROFILE: '/user/profile/',
    ME: '/user/me/',
    AVATAR: '/user/avatar/',
  },
  AUTH: {
    SEND_OTP: '/auth/send-otp/',
    VERIFY_OTP: '/auth/verify-otp/',
    REFRESH: '/auth/token/refresh/',
    LOGOUT: '/auth/logout/',
  },
  WALLET: {
    OVERVIEW: '/user/wallet/',
    TRANSACTIONS: '/user/wallet/transactions/',
    TOPUP: '/user/wallet/topup/',
    TEST_TOPUP: '/user/wallet/test-topup/',
    CONVERT: '/user/wallet/convert/',
    VERIFY: '/user/wallet/verify/',
  },
  COINS: {
    BALANCE: '/user/coins/balance/',
    TRANSACTIONS: '/user/coins/transactions/',
    PACKAGES: '/user/coins/packages/',
    PURCHASE: '/user/coins/purchase/',
    SPEND: '/user/coins/spend/',
    CONVERT: '/user/coins/convert/',
  },
  MESSAGES: {
    CONVERSATIONS: '/user/messages/conversations/',
    CONVERSATION_DETAIL: (id: string) => `/user/messages/conversations/${id}/`,
    SEND: '/user/messages/send/',
    UNREAD_COUNT: '/user/messages/unread/',
    MARK_READ: (id: string) => `/user/messages/${id}/read/`,
    USER_SEARCH: '/user/messages/users/search/',
  },
  ADS: {
    LIST: '/user/ads/',
    DETAIL: (id: string) => `/user/ads/${id}/`,
    STATUS: (id: string) => `/user/ads/${id}/status/`,
  },
  BANNERS: {
    LIST: '/banners/',
  },
  SUGGESTIONS: {
    LIST: '/suggestions/',
    CREATE: '/suggestions/',
    MY: '/suggestions/my/',
    LIKE: (id: string) => `/suggestions/${id}/like/`,
    ADMIN: (id: string) => `/suggestions/${id}/admin/`,
  },
  QNA: {
    LIST: '/qna/',
    DETAIL: (id: string) => `/qna/${id}/`,
    LIKE: (id: string) => `/qna/${id}/like/`,
  },
  COMPETITIONS: {
    LIST: '/competitions/',
    REGISTER: (id: string) => `/competitions/${id}/register/`,
    UNREGISTER: (id: string) => `/competitions/${id}/unregister/`,
  },
  ANNOUNCEMENTS: {
    LIST: '/announcements/',
  },
  CHAT: {
    CONVERSATIONS: '/chat/',
    CONVERSATIONS_CREATE: '/chat/create/',
    UNREAD_COUNT: '/chat/unread-count/',
  },
  CONTACT: {
    CREATE: '/contact/',
  },
  GIFTS: {
    LIST: '/api/v1/gifts/',
    REDEEM: '/api/v1/gifts/redeem/',
    MY: '/api/v1/gifts/my/',
    VALIDATE: '/api/v1/gifts/validate/',
    APPLY: '/api/v1/gifts/apply/',
  },
  SCHEDULE: {
    LIST: '/schedule/',
    FACULTIES: '/schedule/faculties/',
    DAYS: '/schedule/days/',
  },
  POLLS: {
    LIST: '/polls/',
    PAST: '/polls/past/',
    VOTE: (id: string) => `/polls/${id}/vote/`,
  },
  PSYCHOLOGY_TESTS: {
    LIST: '/psychology-tests/',
    DETAIL: (id: string) => `/psychology-tests/${id}/`,
    QUESTIONS: (id: string) => `/psychology-tests/${id}/questions/`,
    RESULT: (id: string) => `/psychology-tests/${id}/result/`,
    MY_RESULTS: '/psychology-tests/results/',
    COMPLETE: (id: string) => `/psychology-tests/${id}/complete/`,
    PURCHASE: (id: string) => `/psychology-tests/${id}/purchase/`,
  },
  QUESTION_BANK: {
    CATEGORIES: '/categories/',
    QUESTIONS: '/questions/',
    QUESTION_DETAIL: (id: string) => `/questions/${id}/`,
    CREATE: '/questions/create/',
    DOWNLOAD: (id: string) => `/questions/${id}/download/`,
    LIKE: (id: string) => `/questions/${id}/like/`,
    SAVE: (id: string) => `/questions/${id}/save/`,
    PURCHASE: (id: string) => `/questions/${id}/purchase/`,
  },
  COURSES: {
    CATEGORIES: '/education/categories/',
    LIST: '/education/courses/',
    DETAIL: (id: string) => `/education/courses/${id}/`,
    ENROLL: (id: string) => `/education/courses/${id}/enroll/`,
    LESSONS: (id: string) => `/education/courses/${id}/lessons/`,
    MY_COURSES: '/education/courses/my/',
  },
  PAYMENT: {
    REQUEST: '/payment/request/',
    VERIFY: '/payment/verify/',
  },
  CERTIFICATES: {
    MY: '/certificates/my/',
    GENERATE: (courseId: string) => `/certificates/generate/${courseId}/`,
    VERIFY: (code: string) => `/certificates/verify/${code}/`,
    DETAIL: (id: string) => `/certificates/${id}/`,
  },
  MARKET: {
    CATEGORIES: '/market/categories/',
    PRODUCTS: '/market/products/',
    ADS: '/market/ads/',
    MY_ADS: '/market/my-ads/',
    MY_PRODUCTS: '/market/my-products/',
    CART: '/market/cart/',
    CART_ADD: '/market/cart/add/',
    CART_CLEAR: '/market/cart/clear/',
    CART_ITEMS: '/market/cart/items/',
    ORDERS: '/market/orders/',
    COUPONS: '/market/coupons/',
    COUPON_APPLY: '/market/coupons/apply/',
  },
  NOTIFICATIONS: {
    LIST: '/notifications/',
    DETAIL: '/notifications/',
    MARK_ALL_READ: '/notifications/mark-all-read/',
    UNREAD_COUNT: '/notifications/unread-count/',
  },
} as const;
