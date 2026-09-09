'use client';
import { LoaderCircle, Paperclip, SendHorizontal, X, AlertCircle, Mic, Square } from 'lucide-react';
import { MicrophoneButton } from '@/components/ai/MicrophoneButton';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { DraftAttachment } from '@/components/ai/type';

interface ChatComposerProps {
  composerValue: string;
  setComposerValue: (value: string | ((prev: string) => string)) => void;
  handleSend: () => void;
  sending: boolean;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  handlePickFiles: (files: FileList | null) => void;
  draftFiles?: DraftAttachment[];
  removeDraftFile?: (localId: string) => void;
  limitError?: { message: string; code: string } | null;
  onClearLimitError?: () => void;
}

export default function ChatComposer({
  composerValue,
  setComposerValue,
  handleSend,
  sending,
  fileInputRef,
  handlePickFiles,
  draftFiles = [],
  removeDraftFile,
  limitError,
  onClearLimitError,
}: ChatComposerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const router = useRouter();
  const internalFileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = fileInputRef ?? internalFileRef;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const canSend =
    (composerValue.trim().length > 0 || audioBlob || draftFiles.length > 0) && !sending;

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [composerValue]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const onSend = () => {
    if (!canSend) return;
    handleSend();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const goToCoinsPage = () => {
    router.push('/panel/coins');
  };

  // ===== ضبط صدا =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setIsAudioReady(true);
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsAudioReady(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('دسترسی به میکروفون امکان‌پذیر نیست');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setAudioBlob(null);
    setIsAudioReady(false);
    setRecordingTime(0);
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setIsAudioReady(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-border bg-background p-2.5 sm:p-3">
      {limitError && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1 leading-5">{limitError.message}</span>
          <button
            type="button"
            onClick={goToCoinsPage}
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-white font-medium hover:bg-amber-700 active:scale-95 transition"
          >
            شارژ کن 💰
          </button>
          {onClearLimitError && (
            <button
              type="button"
              onClick={onClearLimitError}
              className="shrink-0 rounded p-0.5 hover:bg-amber-100"
              aria-label="بستن"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-error/10 px-3 py-2 text-xs text-error">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 rounded p-0.5 hover:bg-error/10"
            aria-label="بستن پیام خطا"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ===== وضعیت ضبط صدا ===== */}
      {isRecording && (
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-2">
          <div className="flex h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
            در حال ضبط... {formatTime(recordingTime)}
          </span>
          <button
            onClick={stopRecording}
            className="rounded-full bg-rose-500 p-1 text-white hover:bg-rose-600 transition-colors"
          >
            <Square className="h-4 w-4" />
          </button>
          <button
            onClick={cancelRecording}
            className="text-sm text-rose-500 hover:text-rose-600 transition-colors"
          >
            لغو
          </button>
        </div>
      )}

      {/* ===== پیش‌نمایش صدا ===== */}
      {audioBlob && !isRecording && (
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Mic className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-foreground">
            پیام صوتی ({formatTime(recordingTime)})
          </span>
          <audio controls className="h-8 flex-1">
            <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
          </audio>
          <button
            onClick={removeAudio}
            className="text-foreground-muted hover:text-error transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ===== فایل‌های پیوست ===== */}
      {draftFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {draftFiles.map((file) => (
            <div
              key={file.localId}
              className={`
                flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs
                ${
                  file.status === 'error'
                    ? 'border-error/30 bg-error/10 text-error'
                    : 'border-border bg-background-subtle text-foreground-muted'
                }
              `}
            >
              {file.status === 'uploading' ? (
                <LoaderCircle className="h-3 w-3 shrink-0 animate-spin" />
              ) : (
                <Paperclip className="h-3 w-3 shrink-0" />
              )}
              <span className="max-w-[140px] truncate">{file.filename}</span>
              {removeDraftFile && (
                <button
                  type="button"
                  onClick={() => removeDraftFile(file.localId)}
                  className="shrink-0 rounded-full p-0.5 hover:bg-background-elevated"
                  aria-label={`حذف ${file.filename}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== کامپوزر اصلی ===== */}
      <div className="flex items-end gap-1.5 sm:gap-2 rounded-2xl border border-border bg-card p-1.5 sm:p-2 shadow-sm focus-within:border-primary/50 transition-colors">
        {/* دکمه میکروفون */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={sending}
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95
            ${
              isRecording
                ? 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse'
                : 'text-foreground-muted hover:bg-background-subtle hover:text-foreground'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label={isRecording ? 'توقف ضبط' : 'ضبط صدا'}
        >
          <Mic className="h-4 w-4" />
        </button>

        {/* دکمه پیوست */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-foreground-muted transition-colors hover:bg-background-subtle hover:text-foreground active:scale-95"
          aria-label="پیوست فایل"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* ورودی متن */}
        <textarea
          ref={textareaRef}
          value={composerValue}
          onChange={(e) => setComposerValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="پیام خود را بنویسید..."
          className="flex-1 resize-none bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-foreground-muted max-h-40"
        />

        {/* دکمه ارسال */}
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95
            ${
              canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                : 'bg-background-subtle text-foreground-muted cursor-not-allowed'
            }
          `}
          aria-label="ارسال پیام"
        >
          {sending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* فایل اینپوت مخفی */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handlePickFiles(e.target.files)}
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
      />
    </div>
  );
}
