"use client";
import { Plus, Search, Trash2, X, MessageSquare } from "lucide-react";
import { AiSession } from "@/lib/aiClient";
import { getSessionTitle } from "./helpers";

interface ChatSidebarProps {
  sessions: AiSession[];
  filteredSessions: AiSession[];
  messageMap: Record<string, any[]>;
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  setSettingsDraft: (settings: any) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  chatSearch: string;
  setChatSearch: (value: string) => void;
  resetDraftChat: () => void;
  handleDeleteSession: (id: string) => void;
}

export default function ChatSidebar({
  sessions,
  messageMap,
  activeSessionId,
  setActiveSessionId,
  setSettingsDraft,
  sidebarOpen,
  setSidebarOpen,
  filteredSessions,
  chatSearch,
  setChatSearch,
  resetDraftChat,
  handleDeleteSession,
}: ChatSidebarProps) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between  border-border p-4">
            <h2 className="text-sm font-black text-foreground">گفتگوها</h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="بستن منو"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground-muted transition-colors hover:bg-background-subtle hover:text-foreground lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 pt-4">
            <button
              type="button"
              onClick={resetDraftChat}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-foreground-inverted transition-colors hover:bg-primary-hover active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              گفتگوی جدید
            </button>
          </div>

          <div className="mx-4 mt-3 flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-primary/50">
            <Search className="h-4 w-4 shrink-0 text-foreground-muted" />
            <input
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="جستجوی گفتگو..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
            />
          </div>

          <div className="mt-3 flex-1 overflow-y-auto px-3 pb-3">
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <MessageSquare className="h-8 w-8 text-foreground-muted" />
                <p className="text-xs text-foreground-muted">
                  {chatSearch ? "گفتگویی یافت نشد" : "هنوز گفتگویی نداری"}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredSessions.map((session) => {
                  const isActive = activeSessionId === session.id;
                  return (
                    <div
                      key={session.id}
                      className={`
                        group flex items-center gap-2 rounded-2xl p-2.5 transition-colors
                        ${isActive ? "bg-primary-soft text-primary-text" : "hover:bg-background-subtle"}
                      `}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSessionId(session.id);
                          setSettingsDraft(session.settings);
                          setSidebarOpen(false);
                        }}
                        className="min-w-0 flex-1 text-right"
                      >
                        <p className="truncate text-sm font-medium">
                          {getSessionTitle(session, messageMap[session.id] ?? [])}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(session.id)}
                        aria-label="حذف گفتگو"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-foreground-muted opacity-0 transition-all hover:bg-error/10 hover:text-error group-hover:opacity-100 sm:opacity-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}