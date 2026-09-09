// ===== CSRF Tokens =====
export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

// ===== Safe Methods (no CSRF protection needed) =====
export const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'] as const;

// ===== Type Helpers =====
export type SafeMethod = (typeof SAFE_METHODS)[number];
