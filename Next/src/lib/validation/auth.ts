// ===== Constants =====
export const MOBILE_ERROR_MESSAGE =
  'شماره موبایل باید با 09 شروع شود و 11 رقم باشد';
export const OTP_ERROR_MESSAGE = 'کد تایید باید دقیقا ۶ رقم عددی باشد';

const MOBILE_REGEX = /^09\d{9}$/;
const OTP_REGEX = /^\d{6}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;

const MIN_FIRST_NAME_LENGTH = 3;
const MIN_LAST_NAME_LENGTH = 3;
const MIN_USERNAME_LENGTH = 4;
const MAX_USERNAME_LENGTH = 20;

// ===== Mobile =====
export function normalizeMobile(value: string): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function validateMobile(value: string) {
  const digitsOnly = String(value ?? '').replace(/\D/g, '');
  const normalized = normalizeMobile(digitsOnly);
  const isValid = MOBILE_REGEX.test(digitsOnly);

  return {
    digitsOnly,
    normalized,
    isValid,
    error: isValid ? '' : MOBILE_ERROR_MESSAGE,
  };
}

// ===== OTP =====
export function sanitizeOtpInput(value: string): string {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6);
}

export function validateOtp(value: string) {
  const sanitized = sanitizeOtpInput(value);
  const isValid = OTP_REGEX.test(sanitized);

  return {
    value: sanitized,
    isValid,
    error: isValid ? '' : OTP_ERROR_MESSAGE,
  };
}

// ===== First Name =====
export function validateFirstName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'این قسمت را خالی نگذارید.';
  if (trimmed.length < MIN_FIRST_NAME_LENGTH) {
    return `نام باید حداقل ${MIN_FIRST_NAME_LENGTH} کاراکتر باشد.`;
  }
  return null;
}

// ===== Last Name =====
export function validateLastName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'این قسمت را خالی نگذارید.';
  if (trimmed.length < MIN_LAST_NAME_LENGTH) {
    return `نام خانوادگی باید حداقل ${MIN_LAST_NAME_LENGTH} کاراکتر باشد.`;
  }
  return null;
}

// ===== Username =====
export function validateUsername(value: string): string | null {
  const username = String(value ?? '').trim();

  if (!username) return 'این قسمت را خالی نگذارید.';
  if (
    username.length < MIN_USERNAME_LENGTH ||
    username.length > MAX_USERNAME_LENGTH
  ) {
    return `تعداد کاراکتر باید بین ${MIN_USERNAME_LENGTH} تا ${MAX_USERNAME_LENGTH} کاراکتر باشد.`;
  }
  if (!USERNAME_REGEX.test(username)) {
    return 'لطفاً فقط از حروف انگلیسی، اعداد، نقطه و آندرلاین استفاده کنید.';
  }

  return null;
}

// ===== Profile Form =====
export interface ProfileErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
}

export function validateProfileForm(values: {
  firstName: string;
  lastName: string;
  username: string;
}): ProfileErrors {
  const firstNameError = validateFirstName(values.firstName);
  const lastNameError = validateLastName(values.lastName);
  const usernameError = validateUsername(values.username);

  return {
    ...(firstNameError && { firstName: firstNameError }),
    ...(lastNameError && { lastName: lastNameError }),
    ...(usernameError && { username: usernameError }),
  };
}
