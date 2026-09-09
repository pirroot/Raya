import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_MOBILE_PATH,
  AUTH_OTP_PATH,
  AUTH_PROFILE_PATH,
  OTP_CHALLENGE_COOKIE,
  PANEL_PATH,
  REFRESH_TOKEN_COOKIE,
  REGISTRATION_STEP_COOKIE,
  REGISTRATION_TOKEN_COOKIE,
} from '@/lib/auth-constants';

const PROTECTED_PATHS = ['/panel', '/ai', '/messages', '/chat'];
const AUTH_PATHS = ['/auth', AUTH_MOBILE_PATH, AUTH_OTP_PATH, AUTH_PROFILE_PATH];

function redirect(request: NextRequest, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function getAuthCookies(request: NextRequest) {
  return {
    accessToken: request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: request.cookies.get(REFRESH_TOKEN_COOKIE)?.value,
    registrationToken: request.cookies.get(REGISTRATION_TOKEN_COOKIE)?.value,
    registrationStep: request.cookies.get(REGISTRATION_STEP_COOKIE)?.value,
    otpChallenge: request.cookies.get(OTP_CHALLENGE_COOKIE)?.value,
  };
}

function isAuthenticated(cookies: any): boolean {
  return !!(cookies.accessToken || cookies.refreshToken);
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(path));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

export function proxy(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const cookies = getAuthCookies(request);
  const isAuth = isAuthenticated(cookies);

  // ===== اگر کاربر لاگین هست و به صفحه complete-profile رفته =====
  if (pathname === AUTH_PROFILE_PATH) {
    // ===== اگر registrationToken داره، اجازه بده صفحه رو ببینه =====
    if (cookies.registrationToken && cookies.registrationStep === 'profile') {
      return NextResponse.next();
    }
    // ===== اگر لاگین هست ولی registrationToken نداره، بره پنل =====
    if (isAuth) {
      return redirect(request, PANEL_PATH);
    }
    // ===== نه لاگین و نه registrationToken، بره موبایل =====
    return redirect(request, AUTH_MOBILE_PATH);
  }

  // ===== اگر لاگین هست و به صفحه auth دیگه‌ای رفته =====
  if (isAuth && isAuthPath(pathname) && pathname !== AUTH_PROFILE_PATH) {
    return redirect(request, PANEL_PATH);
  }

  // ===== مسیرهای محافظت شده =====
  if (isProtectedPath(pathname) && !isAuth) {
    return redirect(request, AUTH_MOBILE_PATH);
  }

  // ===== اگر کاربر جدید هست و registrationToken داره =====
  if (cookies.registrationToken && cookies.registrationStep === 'profile') {
    // ===== اگه به غیر از complete-profile رفته، ببرش به complete-profile =====
    if (pathname !== AUTH_PROFILE_PATH && !isProtectedPath(pathname)) {
      return redirect(request, AUTH_PROFILE_PATH);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/:path*', '/panel/:path*', '/ai/:path*', '/chat/:path*', '/messages/:path*'],
};
