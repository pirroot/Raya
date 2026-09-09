import type { AiAttachment, AiMessage } from '@/lib/aiClient';

export type DraftAttachment = {
  localId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  uploaded?: AiAttachment;
};

export type UiMessage = AiMessage & {
  animate?: boolean;
  temporary?: boolean;
};
