'use client';

import api from '@/lib/api';
import { ensureCsrfToken } from '@/lib/csrf';
import { CSRF_HEADER } from '@/lib/csrf-constants';

// ===== Types =====
export type AiResponseStyle =
  | 'balanced'
  | 'emotional'
  | 'engineer'
  | 'programmer'
  | 'coach'
  | 'formal';

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type MessageStatus = 'completed' | 'error' | 'processing';
export type Reaction = 'like' | 'dislike' | null;
export type BillingMode = 'daily-free' | 'coins';

export interface BillingInfo {
  usedCoins: number;
  charged: boolean;
  refunded: boolean;
  mode: BillingMode;
}

export interface AiSettings {
  id?: string;
  sessionId: string;
  model: string;
  temperature: number;
  maxTokens: number;
  allowFileContext: boolean;
  saveHistory: boolean;
  displayName: string;
  responseStyle: AiResponseStyle;
  customPrompt: string;
  streamingEnabled: boolean;
  fallbackEnabled: boolean;
  createdAt?: string;
}

export interface AiSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  settings: AiSettings | null;
}

export interface AiAttachment {
  id: string;
  sessionId?: string | null;
  filename: string;
  mimeType?: string | null;
  size: number;
  createdAt?: string;
  hasExtractedText?: boolean;
}

export interface AiMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  type: string;
  content: string;
  status: MessageStatus;
  reaction: Reaction;
  createdAt: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  coinsCharged: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  attachments: AiAttachment[];
  fileIds: string[];
  billing?: {
    mode: BillingMode;
    refunded?: boolean;
  } | null;
  countsTowardQuota?: boolean;
}

export interface AiUsageSummary {
  dailyFreeLimit: number;
  usedFreeMessages: number;
  remainingFreeMessages: number;
  coinCostPerMessage: number;
  paidMessages: number;
  freeMessagesWindowStartedAt?: string | null;
  freeMessagesWindowEndsAt?: string | null;
  isFreeLimitReached?: boolean;
}

export interface CoinBalanceSnapshot {
  balance: number;
  version: number;
  ratePerCoin: number;
  currency: string;
  lastActivityAt?: string | null;
  updatedAt?: string | null;
}

export interface AiBootstrap {
  user: {
    firstName: string;
    username: string;
    avatarUrl?: string | null;
  };
  balance: CoinBalanceSnapshot;
  usage: AiUsageSummary;
  sessions: AiSession[];
}

export interface SendMessageResult {
  session: AiSession;
  userMessage: AiMessage;
  assistantMessage: AiMessage;
  usage: AiUsageSummary;
  balance: CoinBalanceSnapshot;
  billing: BillingInfo;
}

// ===== خطای محدودیت پیام رایگان / سکه ناکافی (۴۰۲) =====
export interface AiSendLimitError {
  code: 'insufficient_coins' | 'free_limit_reached';
  message: string;
  usage?: AiUsageSummary;
  balance?: CoinBalanceSnapshot;
}

// ===== Constants =====
const BOOTSTRAP_MAX_RETRIES = 4;
const BOOTSTRAP_RETRY_DELAY_MS = 180;

// ===== State =====
let inFlightBootstrapRequest: Promise<AiBootstrap> | null = null;

// ===== Helpers =====
function isValidMessageRole(role: string): role is MessageRole {
  return ['USER', 'ASSISTANT', 'SYSTEM'].includes(role.toUpperCase());
}

function normalizeMessageRole(role: string): MessageRole {
  const normalized = role?.toUpperCase() || 'ASSISTANT';
  return isValidMessageRole(normalized) ? normalized : 'ASSISTANT';
}

function normalizeAiMessage(message: AiMessage): AiMessage {
  return {
    ...message,
    role: normalizeMessageRole(message.role),
  };
}

function normalizeSendMessageResult(result: SendMessageResult): SendMessageResult {
  return {
    ...result,
    userMessage: {
      ...normalizeAiMessage(result.userMessage),
      role: 'USER',
    },
    assistantMessage: {
      ...normalizeAiMessage(result.assistantMessage),
      role: 'ASSISTANT',
    },
  };
}

function isMeaningfulErrorPayload(payload: unknown): boolean {
  if (!payload) return false;
  if (typeof payload === 'string') return payload.trim().length > 0;
  if (typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    return 'message' in data || 'error' in data || 'errors' in data;
  }
  return false;
}

function shouldRetryBootstrap(error: any): boolean {
  const status = Number(error?.response?.status);
  return (
    status === 502 ||
    status === 503 ||
    (status === 400 && !isMeaningfulErrorPayload(error?.response?.data))
  );
}

function getRetryDelay(attempt: number): number {
  return BOOTSTRAP_RETRY_DELAY_MS * (attempt + 1);
}

// ===== تشخیص خطای ۴۰۲ (محدودیت رایگان / سکه ناکافی) =====
export function isPaymentRequiredError(error: any): boolean {
  return error?.response?.status === 402;
}

export function getPaymentErrorInfo(error: any): AiSendLimitError | null {
  if (!isPaymentRequiredError(error)) return null;

  const data = error.response?.data || {};

  return {
    code: data.code === 'free_limit_reached' ? 'free_limit_reached' : 'insufficient_coins',
    message: data.error || data.message || 'پیام‌های رایگان امروزت تموم شده و سکه کافی هم نداری.',
    usage: data.usage,
    balance: data.balance,
  };
}

// ===== API Functions =====
export async function getAiBootstrap(): Promise<AiBootstrap> {
  if (inFlightBootstrapRequest) {
    return inFlightBootstrapRequest;
  }

  let lastError: unknown;

  inFlightBootstrapRequest = (async () => {
    for (let attempt = 0; attempt < BOOTSTRAP_MAX_RETRIES; attempt++) {
      try {
        const response = await api.get('/ai/bootstrap/');
        return response.data;
      } catch (error) {
        lastError = error;
        if (!shouldRetryBootstrap(error) || attempt === BOOTSTRAP_MAX_RETRIES - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, getRetryDelay(attempt)));
      }
    }
    throw lastError;
  })();

  try {
    return await inFlightBootstrapRequest;
  } finally {
    inFlightBootstrapRequest = null;
  }
}

export async function listAiSessions(search?: string): Promise<AiSession[]> {
  const response = await api.get('/ai/sessions/', {
    params: search?.trim() ? { search: search.trim() } : undefined,
  });
  return response.data;
}

export async function createAiSession(
  payload: Partial<{
    content: string;
    fileIds: string[];
    model: string;
    temperature: number;
    maxTokens: number;
    allowFileContext: boolean;
    saveHistory: boolean;
    displayName: string;
    responseStyle: AiResponseStyle;
    customPrompt: string;
    streamingEnabled: boolean;
    fallbackEnabled: boolean;
  }>
): Promise<SendMessageResult> {
  const response = await api.post('/ai/sessions/', payload ?? {});
  return normalizeSendMessageResult(response.data);
}

export async function deleteAiSession(sessionId: string): Promise<void> {
  await api.delete(`/ai/sessions/${sessionId}/`);
}

export async function getAiHistory(sessionId: string): Promise<AiMessage[]> {
  const response = await api.get(`/ai/sessions/${sessionId}/history/`);

  let items = response.data;

  if (Array.isArray(items)) {
    return items.map(normalizeAiMessage);
  }

  if (items && typeof items === 'object' && Array.isArray(items.items)) {
    return items.items.map(normalizeAiMessage);
  }

  console.warn('Unexpected history response format:', response.data);
  return [];
}

export async function sendAiMessage(
  sessionId: string,
  payload: { content: string; fileIds?: string[] }
): Promise<{
  session: AiSession;
  userMessage: AiMessage;
  assistantMessage: AiMessage;
  usage: AiUsageSummary;
  balance: CoinBalanceSnapshot;
  billing: BillingInfo;
}> {
  const response = await api.post(`/ai/sessions/${sessionId}/messages/`, payload);
  return {
    session: response.data.session,
    userMessage: normalizeAiMessage(response.data.userMessage),
    assistantMessage: normalizeAiMessage(response.data.assistantMessage),
    usage: response.data.usage,
    balance: response.data.balance,
    billing: response.data.billing,
  };
}

export async function updateAiSettings(
  sessionId: string,
  payload: Partial<AiSettings>
): Promise<AiSettings> {
  const response = await api.patch(`/ai/sessions/${sessionId}/settings/`, {
    model: payload.model,
    temperature: payload.temperature,
    maxTokens: payload.maxTokens,
    allowFileContext: payload.allowFileContext,
    saveHistory: payload.saveHistory,
    displayName: payload.displayName,
    responseStyle: payload.responseStyle,
    customPrompt: payload.customPrompt,
    streamingEnabled: payload.streamingEnabled,
    fallbackEnabled: payload.fallbackEnabled,
  });
  return response.data;
}

export async function setAiMessageReaction(
  messageId: string,
  reaction?: Reaction
): Promise<AiMessage> {
  const response = await api.patch(`/ai/messages/${messageId}/reaction/`, {
    reaction: reaction || null,
  });
  return response.data;
}

export async function uploadAiFile(
  file: File,
  sessionId?: string,
  onProgress?: (progress: number) => void
): Promise<AiAttachment> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/ai/files/', formData, {
    params: sessionId ? { sessionId } : undefined,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
}
