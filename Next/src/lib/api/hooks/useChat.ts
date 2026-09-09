// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import api, { API_BASE_URL, API_ENDPOINTS } from '@/lib/api';
// import axios from 'axios';

// export interface Conversation {
//   id: string;
//   participants: Array<{
//     id: string;
//     full_name: string;
//     mobile: string;
//     avatar_url?: string;
//   }>;
//   last_message: string;
//   last_message_at: string;
//   unread_count: number;
// }

// export interface Message {
//   id: string;
//   sender: {
//     id: string;
//     full_name: string;
//     mobile: string;
//     avatar_url?: string;
//   };
//   content: string;
//   is_read: boolean;
//   read_at?: string;
//   created_at: string;
// }

// export function useConversations() {
//   return useQuery({
//     queryKey: ['conversations'],
//     queryFn: async () => {
//       const response = await api.get(API_ENDPOINTS.CHAT.CONVERSATIONS);
//       return {
//         items: response.data.results || response.data.items || response.data || [],
//       };
//     },
//   });
// }

// export function useConversationDetail(conversationId: string) {
//   return useQuery({
//     queryKey: ['conversation', conversationId],
//     queryFn: async () => {
//       const response = await api.get(`${API_ENDPOINTS.CHAT.CONVERSATIONS}${conversationId}/`);
//       return response.data as Conversation & { messages: Message[] };
//     },
//     enabled: !!conversationId,
//   });
// }

// export function useCreateConversation() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async (participantId: string) => {
//       const response = await api.post(API_ENDPOINTS.CHAT.CONVERSATIONS_CREATE, {
//         participant_id: participantId,
//       });
//       return response.data as Conversation;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['conversations'] });
//     },
//   });
// }

// export function useSendMessage(conversationId: string) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async (content: string) => {
//       const response = await api.post(
//         `${API_ENDPOINTS.CHAT.CONVERSATIONS}${conversationId}/send/`,
//         { content }
//       );
//       return response.data as Message;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
//       queryClient.invalidateQueries({ queryKey: ['conversations'] });
//     },
//   });
// }

// export function useMarkAsRead(conversationId: string) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async () => {
//       const response = await api.post(`${API_ENDPOINTS.CHAT.CONVERSATIONS}${conversationId}/read/`);
//       return response.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
//       queryClient.invalidateQueries({ queryKey: ['conversations'] });
//     },
//   });
// }

// export function useUnreadCount() {
//   return useQuery({
//     queryKey: ['unread-count'],
//     queryFn: async () => {
//       try {
//         const token = localStorage.getItem('access_token');

//         const response = await axios.get(`${API_BASE_URL}/chat/unread-count/`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         return response.data.unread_count || 0;
//       } catch (error: any) {
//         console.error('❌ Unread count error:', error.response?.data || error.message);
//         return 0;
//       }
//     },
//     refetchInterval: 10000,
//   });
// }
