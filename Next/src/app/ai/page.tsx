'use client';
import ChatComposer from '@/components/ai/ChatComposer';
import ChatHeader from '@/components/ai/ChatHeader';
import ChatMessages from '@/components/ai/ChatMessages';
import ChatSettingsModal from '@/components/ai/ChatSettingsModal';
import ChatSidebar from '@/components/ai/ChatSidebar';
import { getSessionTitle } from '@/lib/aiUnitl/ai_utilities';
import { useAiChat } from '@/lib/api/hooks/useAiChat';
import { useState } from 'react';

export default function AiPage() {
  const chat = useAiChat();
  const sessions = chat?.sessions ?? [];
  const messageMap = chat?.messageMap ?? {};
  const activeSessionId = chat?.activeSessionId ?? null;
  const streamingIds = chat?.streamingIds ?? [];
  const draftFiles = chat?.draftFiles ?? [];
  const activeMessages = chat?.activeMessages ?? [];
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  const [chatSearch, setChatSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const filteredSessions = chatSearch.trim()
    ? sessions.filter((session) => {
        const title = getSessionTitle(session, messageMap[session.id] ?? []);
        return title.toLowerCase().includes(chatSearch.trim().toLowerCase());
      })
    : sessions;

  const resetDraftChat = () => {
    chat?.setActiveSessionId?.(null);
    setSidebarOpen(false);
  };

  const limitChip = chat?.usage
    ? `${chat.usage.remainingFreeMessages ?? 0} از ${chat.usage.dailyFreeLimit ?? 5} رایگان`
    : null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar
        sessions={sessions}
        filteredSessions={filteredSessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={chat?.setActiveSessionId || (() => {})}
        messageMap={messageMap}
        handleDeleteSession={chat?.handleDeleteSession || (() => {})}
        chatSearch={chatSearch}
        setChatSearch={setChatSearch}
        resetDraftChat={resetDraftChat}
        setSettingsDraft={chat?.setSettingsDraft || (() => {})}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          userCard={chat?.user || null}
          balance={chat?.balance || null}
          limitChip={limitChip}
          activeSession={activeSession}
          activeMessages={activeMessages}
          getSessionTitle={getSessionTitle}
          accountMenuOpen={accountMenuOpen}
          setAccountMenuOpen={setAccountMenuOpen}
          setSettingsOpen={setSettingsOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <ChatMessages
          activeMessages={activeMessages}
          loadingHistory={chat?.loadingHistory || false}
          streamingIds={streamingIds}
          setStreamingIds={chat?.setStreamingIds || (() => {})}
          handleReaction={chat?.handleReaction || (() => {})}
        />

        <ChatComposer
          composerValue={chat?.composerValue || ''}
          setComposerValue={chat?.setComposerValue || (() => {})}
          handleSend={chat?.handleSend || (() => {})}
          sending={chat?.sending || false}
          handlePickFiles={chat?.handlePickFiles || (() => {})}
          draftFiles={draftFiles}
          removeDraftFile={chat?.removeDraftFile}
          limitError={chat?.limitError || null}
          onClearLimitError={() => chat?.setLimitError?.(null)}
          generalError={chat?.error || null}
          onClearGeneralError={() => chat?.setError?.(null)}
        />
      </div>

      <ChatSettingsModal
        settingsOpen={settingsOpen}
        settingsDraft={chat?.settingsDraft || null}
        setSettingsOpen={setSettingsOpen}
        setSettingsDraft={chat?.setSettingsDraft || (() => {})}
        handleSaveSettings={chat?.handleSaveSettings || (() => {})}
      />
    </div>
  );
}
