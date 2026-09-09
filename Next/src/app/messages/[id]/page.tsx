'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Send, User } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { useConversation, useSendMessage } from '@/lib/api/hooks/useMessages';
import { isAuthError } from '@/lib/api-error';
import api, { API_ENDPOINTS } from '@/lib/api';

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading, error } = useConversation(conversationId);
  const sendMessage = useSendMessage();

  // ===== دریافت userId از پروفایل =====
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.USERS.PROFILE);
        if (response.data?.id) {
          setUserId(response.data.id);
          localStorage.setItem('user_id', response.data.id);
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUser();
  }, []);

  // ===== Scroll to bottom =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // ===== Auth check (بعد از همه useEffectها) =====
  if (error && isAuthError(error)) {
    router.replace('/auth/mobile');
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessage.isPending) return;

    await sendMessage.mutateAsync({
      conversation_id: conversationId,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  if (isLoading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Container>
    );
  }

  if (!conversation) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <p className="text-foreground-muted">مکالمه‌ای یافت نشد</p>
      </Container>
    );
  }

  const otherUser = conversation.other_user;

  return (
    <Container className="pb-28 pt-2 lg:pb-16 lg:pt-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/messages" className="btn btn-secondary rounded-[var(--radius)] p-2">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <h1 className="text-sm font-black text-foreground">{otherUser?.first_name || 'کاربر'}</h1>
        </div>
      </div>

      {/* Messages */}
      <Card className="p-4 min-h-[60vh] max-h-[60vh] overflow-y-auto">
        {conversation.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-foreground-muted">
            <p className="text-sm">هنوز پیامی ارسال نشده است</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversation.messages.map((msg) => {
              const isMine = msg.sender.id === userId;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isMine ? 'bg-primary text-white' : 'bg-background-subtle text-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`mt-1 text-[8px] ${
                        isMine ? 'text-white/60' : 'text-foreground-muted/60'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card>

      {/* Input */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          type="text"
          placeholder="پیام خود را بنویسید..."
          className="input flex-1 text-sm"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sendMessage.isPending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sendMessage.isPending}
          className="btn btn-primary shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </Container>
  );
}
