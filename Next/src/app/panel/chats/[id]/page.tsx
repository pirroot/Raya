'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Send, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useConversationDetail, useSendMessage, useMarkAsRead } from '@/lib/api/hooks/useChat';

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useConversationDetail(conversationId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(conversationId);
  const { mutate: markAsRead } = useMarkAsRead(conversationId);

  const conversation = data;
  const messages = conversation?.messages || [];
  const participants = conversation?.participants || [];

  const otherUser = participants.find((p: any) => p.id !== 'current_user_id');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      markAsRead();
    }
  }, [conversationId, markAsRead]);

  const handleSend = async () => {
    if (!message.trim()) return;

    sendMessage(message, {
      onSuccess: () => {
        setMessage('');
        refetch();
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  if (isError || !conversation) {
    return (
      <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/panel/chats" className="btn btn-secondary rounded-(--radius) p-2">
            <ArrowRight className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-black text-foreground">چت پیدا نشد</h1>
        </div>
        <Card className="p-8 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-foreground-muted/30" />
          <p className="mt-2 text-sm font-bold text-foreground-muted">
            مکالمه‌ای با این شناسه وجود ندارد
          </p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      {/* ===== Header ===== */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/panel/chats" className="btn btn-secondary rounded-(--radius) p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-foreground">
            {otherUser?.full_name || 'کاربر ناشناس'}
          </h1>
          <p className="text-xs text-foreground-muted">{otherUser?.mobile || ''}</p>
        </div>
      </div>

      {/* ===== پیام‌ها ===== */}
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto p-1">
        {messages.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-foreground-muted/30" />
            <p className="mt-2 text-sm text-foreground-muted">هنوز پیامی ارسال نشده است</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.sender?.id === 'current_user_id';
            const showDate =
              index === 0 ||
              new Date(msg.created_at).toDateString() !==
                new Date(messages[index - 1].created_at).toDateString();

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="my-3 text-center text-[10px] text-foreground-muted/60">
                    {formatDate(msg.created_at)}
                  </div>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      isMine
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background-subtle text-foreground'
                    }`}
                  >
                    <p className="wrap-break-word">{msg.content}</p>
                    <div
                      className={`mt-0.5 text-[9px] ${
                        isMine ? 'text-primary-foreground/70' : 'text-foreground-muted/60'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                      {isMine && msg.is_read && <CheckCircle2 className="inline h-3 w-3 mr-0.5" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ===== Input ===== */}
      <div className="mt-3 flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="پیام خود را بنویسید..."
          className="input flex-1 min-h-11 max-h-32 resize-y text-sm leading-6"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={isSending || !message.trim()}
          className="btn btn-primary h-11 w-11 shrink-0 p-0"
        >
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </Container>
  );
}
