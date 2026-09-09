import { NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  OTP_CHALLENGE_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REGISTRATION_PROFILE_COOKIE,
  REGISTRATION_STEP_COOKIE,
  REGISTRATION_TOKEN_COOKIE,
} from '@/lib/auth-constants';

// ===== Constants =====
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEFAULT_ACCESS_TTL = 15 * 60; // 15 minutes
const DEFAULT_REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days
const DEFAULT_OTP_TTL = 60 * 10; // 10 minutes
const DEFAULT_REGISTRATION_TTL = 60 * 20; // 20 minutes

// ===== Types =====
export interface AuthTokenPayload {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  refresh_expires_in?: number;
}

// ===== Helpers =====
function buildCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

// ===== Access Token =====
export function setAccessTokenCookie(response: NextResponse, token: string) {
  setAccessTokenCookieWithMaxAge(response, token, DEFAULT_ACCESS_TTL);
}

export function setAccessTokenCookieWithMaxAge(
  response: NextResponse,
  token: string,
  maxAgeSeconds: number
) {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    token,
    buildCookieOptions(maxAgeSeconds)
  );
}

// ===== Refresh Token =====
export function setRefreshTokenCookie(
  response: NextResponse,
  token: string,
  maxAgeSeconds: number
) {
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    token,
    buildCookieOptions(maxAgeSeconds)
  );
}

// ===== Session =====
export function setSessionCookiesFromAuthPayload(
  response: NextResponse,
  payload: AuthTokenPayload
) {
  const accessTtl = Math.max(60, payload.expires_in ?? DEFAULT_ACCESS_TTL);
  const refreshTtl = Math.max(
    accessTtl + 60,
    payload.refresh_expires_in ?? DEFAULT_REFRESH_TTL
  );

  setAccessTokenCookieWithMaxAge(response, payload.access_token, accessTtl);
  setRefreshTokenCookie(response, payload.refresh_token, refreshTtl);
}

// ===== OTP =====
export function setOtpChallengeCookie(
  response: NextResponse,
  token: string,
  expiresIn = DEFAULT_OTP_TTL
) {
  response.cookies.set(
    OTP_CHALLENGE_COOKIE,
    token,
    buildCookieOptions(expiresIn)
  );
}

// ===== Registration =====
export function setRegistrationCookies(
  response: NextResponse,
  token: string,
  step: 'profile' | 'education',
  expiresIn = DEFAULT_REGISTRATION_TTL
) {
  response.cookies.set(
    REGISTRATION_TOKEN_COOKIE,
    token,
    buildCookieOptions(expiresIn)
  );
  response.cookies.set(
    REGISTRATION_STEP_COOKIE,
    step,
    buildCookieOptions(expiresIn)
  );
}

export function setRegistrationProfileCookie(
  response: NextResponse,
  payload: string
) {
  response.cookies.set(
    REGISTRATION_PROFILE_COOKIE,
    payload,
    buildCookieOptions(DEFAULT_REGISTRATION_TTL)
  );
}

// ===== Clear =====
export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(OTP_CHALLENGE_COOKIE);
  response.cookies.delete(REGISTRATION_TOKEN_COOKIE);
  response.cookies.delete(REGISTRATION_STEP_COOKIE);
  response.cookies.delete(REGISTRATION_PROFILE_COOKIE);
}

export function clearOtpChallengeCookie(response: NextResponse) {
  response.cookies.delete(OTP_CHALLENGE_COOKIE);
}

export function clearRegistrationCookies(response: NextResponse) {
  response.cookies.delete(REGISTRATION_TOKEN_COOKIE);
  response.cookies.delete(REGISTRATION_STEP_COOKIE);
  response.cookies.delete(REGISTRATION_PROFILE_COOKIE);
}
