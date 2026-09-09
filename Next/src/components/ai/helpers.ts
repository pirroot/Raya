import { AiSession } from '@/lib/aiClient';
import { UiMessage } from '@/components/ai/type';

export function getSessionTitle(session: AiSession, messages: UiMessage[]) {
  const trimmed = session.title?.trim() || '';

  if (trimmed) return trimmed;

  const first = messages.find((m) => m.role === 'USER');

  if (!first) return 'New chat';

  return first.content.split(' ').slice(0, 5).join(' ');
}
