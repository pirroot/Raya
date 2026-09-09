// ===== API Endpoints =====
export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: '/auth/send-otp/',
    VERIFY_OTP: '/auth/verify-otp/',
    RESEND_OTP: '/auth/send-otp/',
    REFRESH_TOKEN: '/auth/token/refresh/',
    LOGOUT: '/auth/logout/',
  },
  USERS: {
    PROFILE: '/user/profile/',
    AVATAR: '/user/avatar/',
    ME: '/user/me/',
  },
} as const;

// ===== Storage Keys =====
export const REGISTRATION_PROFILE_STORAGE_KEY = 'registration_profile_draft';

// ===== Cookie Keys =====
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const REGISTRATION_TOKEN_COOKIE = 'registration_token';
export const REGISTRATION_STEP_COOKIE = 'registration_step';
export const OTP_CHALLENGE_COOKIE = 'otp_challenge_token';
export const REGISTRATION_PROFILE_COOKIE = 'registration_profile_draft';

// ===== Route Paths =====
export const AUTH_MOBILE_PATH = '/auth/mobile';
export const AUTH_OTP_PATH = '/auth/otp';
export const AUTH_PROFILE_PATH = '/auth/complete-profile';
export const AUTH_EDUCATION_PATH = '/auth/';
export const PANEL_PATH = '/panel';

// ===== Auth Routes (for middleware) =====
export const AUTH_ROUTES = [
  AUTH_MOBILE_PATH,
  AUTH_OTP_PATH,
  AUTH_PROFILE_PATH,
  AUTH_EDUCATION_PATH,
] as const;

export const PROTECTED_ROUTES = [PANEL_PATH, '/courses', '/market', '/profile'] as const;

// ===== Type Helpers =====
export type AuthRoute = (typeof AUTH_ROUTES)[number];
export type ProtectedRoute = (typeof PROTECTED_ROUTES)[number];
