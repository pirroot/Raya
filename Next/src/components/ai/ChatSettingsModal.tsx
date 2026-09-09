"use client";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface ChatSettingsModalProps {
  settingsOpen: boolean;
  settingsDraft: { customPrompt?: string } | null;
  setSettingsOpen: (open: boolean) => void;
  setSettingsDraft: (draft: any) => void;
  handleSaveSettings: (draft: any) => void;
}

export default function ChatSettingsModal({
  settingsOpen,
  settingsDraft,
  setSettingsOpen,
  setSettingsDraft,
  handleSaveSettings,
}: ChatSettingsModalProps) {
  const [localPrompt, setLocalPrompt] = useState(settingsDraft?.customPrompt ?? "");

  useEffect(() => {
    setLocalPrompt(settingsDraft?.customPrompt ?? "");
  }, [settingsDraft]);

  if (!settingsOpen) return null;

  const onClose = () => setSettingsOpen(false);

  const onSave = () => {
    const updated = { ...settingsDraft, customPrompt: localPrompt };
    setSettingsDraft(updated);
    handleSaveSettings(updated);
    setSettingsOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-card p-4 shadow-xl sm:rounded-3xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black text-foreground">تنظیمات گفتگو</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground-muted transition-colors hover:bg-background-subtle hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-foreground-muted">
          دستور سفارشی
        </label>
        <textarea
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          rows={4}
          placeholder="مثلاً: همیشه با لحن رسمی پاسخ بده..."
          className="w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-primary/50"
        />

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background-subtle"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-foreground-inverted transition-colors hover:bg-primary-hover"
          >
            ذخیره تنظیمات
          </button>
        </div>
      </div>
    </div>
  );
}