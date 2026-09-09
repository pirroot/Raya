'use client';
import { LoaderCircle, MessageCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import MessageCard from './MessageCard';
import { UiMessage } from './type';

interface ChatMessagesProps {
  activeMessages: UiMessage[];
  loadingHistory?: boolean;
  streamingIds?: string[];
  setStreamingIds: (updater: (current: string[]) => string[]) => void;
  onCopy?: (message: UiMessage) => void;
  onLike?: (message: UiMessage) => void;
  onDislike?: (message: UiMessage) => void;
}

export default function ChatMessages({
  activeMessages = [],
  loadingHistory = false,
  streamingIds = [],
  setStreamingIds,
  onCopy,
  onLike,
  onDislike,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeMessages.length]);

  const handleCopy = (message: UiMessage) => {
    if (onCopy) {
      onCopy(message);
    } else {
      navigator.clipboard.writeText(message.content);
    }
  };

  const handleLike = (message: UiMessage) => {
    onLike?.(message);
  };

  const handleDislike = (message: UiMessage) => {
    onDislike?.(message);
  };

  return (
    <div className="h-screen overflow-y-auto px-3 py-3 sm:px-4">
      {loadingHistory && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-foreground-muted">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          در حال خواندن گفتگو...
        </div>
      )}

      {!loadingHistory && activeMessages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background-subtle text-foreground-muted">
            <MessageCircle className="h-5 w-5" />
          </div>
          <p className="text-sm text-foreground-muted">
            هنوز پیامی ارسال نشده. گفتگو را شروع کنید.
          </p>
        </div>
      )}

      {!loadingHistory && activeMessages.length > 0 && (
        <div className="mx-auto max-w-3xl space-y-2.5">
          {activeMessages.map((message, index) => (
            <MessageCard
              key={message?.id || `message-${index}`}
              message={{
                ...message,
                fileIds: message.fileIds || [],
              }}
              isStreaming={streamingIds.includes(message?.id)}
              onStreamingComplete={() =>
                setStreamingIds((current) => {
                  const newIds = current.filter((id) => id !== message?.id);
                  return newIds;
                })
              }
              onCopy={() => handleCopy(message)}
              onLike={() => handleLike(message)}
              onDislike={() => handleDislike(message)}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
