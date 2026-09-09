import { randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { CSRF_COOKIE, CSRF_HEADER } from '@/lib/csrf-constants';

// ===== Constants =====
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const CSRF_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60; // 24 hours
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// ===== Verify CSRF =====
export function verifyCsrfProtection(
  request: NextRequest
): NextResponse | null {
  if (SAFE_METHODS.includes(request.method)) {
    return null;
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || !isTokenEqual(cookieToken, headerToken)) {
    return NextResponse.json(
      { message: 'CSRF validation failed' },
      { status: 403 }
    );
  }

  return null;
}

// ===== Ensure CSRF Cookie =====
export function ensureCsrfCookie(
  response: NextResponse,
  request: NextRequest
): void {
  const existingToken = request.cookies.get(CSRF_COOKIE)?.value;
  const token = existingToken || generateCsrfToken();

  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_COOKIE_MAX_AGE_SECONDS,
  });
}

// ===== Helpers =====
function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url');
}

function isTokenEqual(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}
