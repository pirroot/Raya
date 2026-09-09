'use client';
import { useEffect, useState, useCallback } from 'react';
import { Bot, Copy, ThumbsDown, ThumbsUp, Loader2, Paperclip, File } from 'lucide-react';

interface MessageCardProps {
  message: {
    id: string;
    role: string;
    content: string;
    status?: string;
    fileIds?: string[]; // ✅ اضافه شد
    attachments?: any[]; // ✅ اضافه شد
  };
  isStreaming: boolean;
  onStreamingComplete: () => void;
  onCopy: () => void;
  onLike: () => void;
  onDislike: () => void;
}

export default function MessageCard({
  message,
  isStreaming,
  onStreamingComplete,
  onCopy,
  onLike,
  onDislike,
}: MessageCardProps) {
  const isUser = message.role === 'USER';
  const isProcessing = message.status === 'processing' || isStreaming;
  const [visibleLength, setVisibleLength] = useState(isStreaming ? 0 : message.content.length);
  const [copied, setCopied] = useState(false);

  const handleStreamingComplete = useCallback(() => {
    if (isStreaming) {
      onStreamingComplete();
    }
  }, [isStreaming, onStreamingComplete]);

  useEffect(() => {
    if (!isStreaming) {
      setVisibleLength(message.content.length);
      return;
    }

    let isMounted = true;
    const interval = setInterval(() => {
      setVisibleLength((c) => {
        const next = Math.min(c + 5, message.content.length);
        if (next >= message.content.length && isMounted) {
          clearInterval(interval);
          setTimeout(() => {
            handleStreamingComplete();
          }, 0);
        }
        return next;
      });
    }, 18);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isStreaming, message.content.length, handleStreamingComplete]);

  const content = message.content.slice(0, visibleLength);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ===== گرفتن fileIds =====
  const fileIds = message.fileIds || [];
  const hasFiles = fileIds.length > 0;

  return (
    <div dir="ltr" className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={`flex max-w-[85%] flex-col gap-1.5 sm:max-w-[75%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`
            whitespace-pre-wrap warp-break-words rounded-2xl px-3.5 py-2.5 text-md leading-relaxed min-h-[40px]
            ${
              isUser
                ? 'rounded-tl-md bg-primary text-foreground-inverted'
                : 'rounded-tr-md border border-border bg-card text-foreground'
            }
          `}
        >
          {isProcessing && !isUser && content.length === 0 ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-foreground-muted">در حال تایپ...</span>
            </div>
          ) : (
            content
          )}
          {isStreaming && content.length > 0 && (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle" />
          )}

          {/* ===== نمایش فایل‌ها ===== */}
          {!isProcessing && hasFiles && (
            <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/30 pt-2">
              {fileIds.map((fileId: string) => (
                <div
                  key={fileId}
                  className="flex items-center gap-1.5 rounded-lg bg-background-subtle px-2.5 py-1.5 text-xs"
                >
                  <Paperclip className="h-3 w-3" />
                  <span>فایل {fileId.slice(0, 8)}...</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isStreaming && !isUser && content.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="کپی پیام"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-background-subtle hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onLike}
              aria-label="پسندیدن"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-background-subtle hover:text-success"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDislike}
              aria-label="نپسندیدن"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-background-subtle hover:text-error"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            {copied && <span className="text-xs text-foreground-muted">کپی شد</span>}
          </div>
        )}
      </div>
    </div>
  );
}
