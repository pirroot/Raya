// ===== Constants =====
const DEFAULT_BACKEND_API_BASE_URL = 'http://127.0.0.1:3001/api/v1';
const DEFAULT_MESSENGER_API_BASE_URL = 'http://127.0.0.1:3004/api/v1';

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1'];

// ===== Helpers =====
function normalizeBaseUrl(value?: string | null): string | null {
  return value?.trim().replace(/\/+$/, '') || null;
}

function isLoopbackUrl(value: string): boolean {
  try {
    const { hostname } = new URL(value);
    return LOOPBACK_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

function getEnvUrl(key: string): string | null {
  return normalizeBaseUrl(
    process.env[key as keyof typeof process.env] as string
  );
}

// ===== Backend URL =====
export function getBackendApiBaseUrl(): string {
  return (
    getEnvUrl('INTERNAL_API_BASE_URL') ||
    getEnvUrl('NEXT_PUBLIC_API_BASE_URL') ||
    DEFAULT_BACKEND_API_BASE_URL
  );
}

export function buildBackendUrl(pathname: string, search = ''): string {
  const normalizedPath = pathname.replace(/^\/+/, '');
  return `${getBackendApiBaseUrl()}/${normalizedPath}${search}`;
}

// ===== Messenger URL =====
export function getMessengerApiBaseUrl(): string {
  const internalUrl = getEnvUrl('INTERNAL_MESSENGER_API_BASE_URL');
  if (internalUrl) return internalUrl;

  const publicUrl = getEnvUrl('NEXT_PUBLIC_MESSENGER_API_BASE_URL');
  if (publicUrl && !isLoopbackUrl(publicUrl)) return publicUrl;

  return (
    getEnvUrl('NEXT_PUBLIC_API_BASE_URL') ||
    publicUrl ||
    DEFAULT_MESSENGER_API_BASE_URL
  );
}

// ===== Internal API URL =====
export function buildInternalApiUrl(pathname: string, search = ''): string {
  const normalizedPath = pathname.replace(/^\/+/, '');
  const baseUrl = normalizedPath.startsWith('messaging/')
    ? getMessengerApiBaseUrl()
    : getBackendApiBaseUrl();
  return `${baseUrl}/${normalizedPath}${search}`;
}
