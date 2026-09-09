'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  AiBootstrap,
  AiSession,
  AiSettings,
  AiUsageSummary,
  CoinBalanceSnapshot,
  createAiSession,
  deleteAiSession,
  getAiBootstrap,
  getAiHistory,
  sendAiMessage,
  updateAiSettings,
  uploadAiFile,
  SendMessageResult,
  getPaymentErrorInfo,
} from '@/lib/aiClient';

import { isAuthError } from '@/lib/api-error';
import { DraftAttachment, UiMessage } from '@/components/ai/type';

const DRAFT_SETTINGS_SESSION_ID = 'draft-session';
const REACTIONS_STORAGE_KEY = 'ai_message_reactions';

// ===== Helper: ذخیره/دریافت واکنش‌ها از LocalStorage =====
function getReactions(): Record<string, 'like' | 'dislike'> {
  try {
    const data = localStorage.getItem(REACTIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setReaction(messageId: string, reaction: 'like' | 'dislike') {
  try {
    const reactions = getReactions();
    reactions[messageId] = reaction;
    localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactions));
  } catch {}
}

function getMessageReaction(messageId: string): 'like' | 'dislike' | null {
  const reactions = getReactions();
  return reactions[messageId] || null;
}

// ===== نوع خطای محدودیت پیام / سکه =====
export interface LimitErrorState {
  message: string;
  code: string;
}

export function useAiChat() {
  const router = useRouter();

  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messageMap, setMessageMap] = useState<Record<string, UiMessage[]>>({});
  const [draftMessages, setDraftMessages] = useState<UiMessage[]>([]);

  const [composerValue, setComposerValue] = useState('');
  const [draftFiles, setDraftFiles] = useState<DraftAttachment[]>([]);
  const [streamingIds, setStreamingIds] = useState<string[]>([]);

  const [user, setUser] = useState<AiBootstrap['user'] | null>(null);
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [balance, setBalance] = useState<CoinBalanceSnapshot | null>(null);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ===== جدید: خطای محدودیت پیام رایگان / سکه ناکافی =====
  const [limitError, setLimitError] = useState<LimitErrorState | null>(null);

  const [settingsDraft, setSettingsDraft] = useState<AiSettings | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeMessages = useMemo(() => {
    if (!activeSessionId) return draftMessages;
    return messageMap[activeSessionId] ?? [];
  }, [activeSessionId, messageMap, draftMessages]);

  // ===== اضافه کردن واکنش‌ها به پیام‌ها =====
  const activeMessagesWithReactions = useMemo(() => {
    return activeMessages.map((msg) => ({
      ...msg,
      reaction: getMessageReaction(msg.id) || msg.reaction || null,
    }));
  }, [activeMessages]);

  // bootstrap
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const data = await getAiBootstrap();
        setSessions(data.sessions);

        // ===== ست کردن آخرین سشن فعال بعد از رفرش =====
        if (data.sessions.length > 0) {
          setActiveSessionId((current) => current ?? data.sessions[0].id);
        }

        setUsage({
          dailyFreeLimit: data.usage.dailyFreeLimit || data.usage.daily_free_limit || 5,
          usedFreeMessages: data.usage.usedFreeMessages || data.usage.used_free_messages || 0,
          remainingFreeMessages:
            data.usage.remainingFreeMessages ||
            (data.usage.dailyFreeLimit || data.usage.daily_free_limit || 5) -
              (data.usage.usedFreeMessages || data.usage.used_free_messages || 0),
          coinCostPerMessage:
            data.usage.coinCostPerMessage || data.usage.coin_cost_per_message || 1,
          paidMessages: data.usage.paidMessages || data.usage.paid_messages || 0,
          freeMessagesWindowEndsAt:
            data.usage.freeMessagesWindowEndsAt || data.usage.free_window_ends_at || null,
          isFreeLimitReached:
            data.usage.isFreeLimitReached ||
            (data.usage.usedFreeMessages || data.usage.used_free_messages || 0) >=
              (data.usage.dailyFreeLimit || data.usage.daily_free_limit || 5),
        });

        setBalance(data.balance);
        setUser(data.user);
      } catch (e) {
        if (isAuthError(e)) router.replace('/auth/mobile');
      }
    };
    bootstrap();
  }, []);

  // load history
  useEffect(() => {
    if (!activeSessionId || messageMap[activeSessionId]) return;

    const load = async () => {
      setLoadingHistory(true);
      const items = await getAiHistory(activeSessionId);
      setMessageMap((c) => ({
        ...c,
        [activeSessionId]: items,
      }));
      setLoadingHistory(false);
    };
    load();
  }, [activeSessionId]);

  // scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const updateSessionMessages = (
    sessionId: string,
    updater: (messages: UiMessage[]) => UiMessage[]
  ) => {
    setMessageMap((current) => ({
      ...current,
      [sessionId]: updater(current[sessionId] ?? []),
    }));
  };

  // ===== handleReaction: فقط LocalStorage =====
  function handleReaction(messageId: string, reaction: 'like' | 'dislike') {
    setReaction(messageId, reaction);
    updateSessionMessages(activeSessionId!, (messages) =>
      messages.map((m) => (m.id === messageId ? { ...m, reaction } : m))
    );
  }

  async function handleSend() {
    const content = composerValue.trim();
    if (!content || sending) return;

    setSending(true);
    setComposerValue('');
    setLimitError(null);

    const sessionId = activeSessionId;

    const fileIds = draftFiles.map((f) => f.uploaded?.id || f.localId).filter(Boolean);

    const optimisticUser: UiMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'USER',
      content,
      status: 'completed',
      attachments: draftFiles.map((f) => f.uploaded || f),
      createdAt: new Date().toISOString(),
      sessionId: sessionId ?? DRAFT_SETTINGS_SESSION_ID,
      type: 'TEXT',
      reaction: null,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      coinsCharged: 0,
      fileIds: fileIds,
      temporary: true,
    };

    const optimisticAssistant: UiMessage = {
      ...optimisticUser,
      id: `temp-ai-${Date.now()}`,
      role: 'ASSISTANT',
      content: '',
      status: 'processing',
      temporary: true,
    };

    setStreamingIds((prev) => [...prev, optimisticAssistant.id]);

    if (sessionId) {
      updateSessionMessages(sessionId, (m) => [...m, optimisticUser, optimisticAssistant]);
    } else {
      setDraftMessages((m) => [...m, optimisticUser, optimisticAssistant]);
    }

    try {
      let result: SendMessageResult;
      let newSessionId: string | null = sessionId;

      if (sessionId) {
        result = await sendAiMessage(sessionId, {
          content,
          fileIds: fileIds,
        });
        newSessionId = result.session.id;
      } else {
        result = await createAiSession({
          content,
          fileIds: fileIds,
        });
        newSessionId = result.session.id;
        setSessions((c) => [result.session, ...c]);
      }

      if (!newSessionId) {
        throw new Error('Session ID not found');
      }

      setStreamingIds((prev) => prev.filter((id) => id !== optimisticAssistant.id));

      setMessageMap((c) => ({
        ...c,
        [newSessionId]: [
          ...(c[newSessionId] ?? []).filter((m) => !m.temporary),
          result.userMessage,
          result.assistantMessage,
        ],
      }));

      setActiveSessionId(newSessionId);

      setDraftFiles([]);

      if (result.usage) setUsage(result.usage);
      if (result.balance) {
        setBalance({
          balance: result.balance.balance,
          ratePerCoin: result.balance.ratePerCoin || 1000,
          currency: result.balance.currency || 'IRR',
          version: result.balance.version || 1,
        });
      }
    } catch (e) {
      console.error('Error in handleSend:', e);

      const paymentInfo = getPaymentErrorInfo(e);

      if (paymentInfo) {
        setLimitError({
          message: paymentInfo.message,
          code: paymentInfo.code,
        });
        if (paymentInfo.usage)
          setUsage((prev) => ({ ...(prev as AiUsageSummary), ...paymentInfo.usage }));
        if (paymentInfo.balance) setBalance(paymentInfo.balance);
      } else {
        setError('ارسال پیام انجام نشد');
      }

      setStreamingIds((prev) => prev.filter((id) => id !== optimisticAssistant.id));

      if (sessionId) {
        updateSessionMessages(sessionId, (m) => m.filter((msg) => !msg.temporary));
      } else {
        setDraftMessages([]);
      }
    }

    setSending(false);
  }

  async function handleDeleteSession(id: string) {
    await deleteAiSession(id);
    setSessions((c) => c.filter((s) => s.id !== id));
  }

  async function handleSaveSettings() {
    if (!activeSessionId || !settingsDraft) return;
    const saved = await updateAiSettings(activeSessionId, settingsDraft);
    setSessions((c) => c.map((s) => (s.id === activeSessionId ? { ...s, settings: saved } : s)));
  }

  async function handlePickFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const uploaded = await uploadAiFile(file, activeSessionId ?? undefined);
      setDraftFiles((c) => [
        ...c,
        {
          localId: uploaded.id,
          filename: uploaded.filename,
          status: 'done',
          progress: 100,
          uploaded,
        },
      ]);
    }
  }

  function removeDraftFile(localId: string) {
    setDraftFiles((c) => c.filter((f) => f.localId !== localId));
  }

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,

    activeMessages: activeMessagesWithReactions,
    messageMap,

    composerValue,
    setComposerValue,

    draftFiles,
    handlePickFiles,
    removeDraftFile,

    sending,
    loadingHistory,

    handleSend,
    handleReaction,
    handleDeleteSession,

    user,
    usage,
    balance,

    error,
    setError,
    limitError,
    setLimitError,

    settingsDraft,
    setSettingsDraft,
    handleSaveSettings,

    streamingIds,
    setStreamingIds,

    messagesEndRef,
  };
}
