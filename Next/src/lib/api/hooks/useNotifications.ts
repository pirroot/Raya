import api, { API_ENDPOINTS } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: { unread?: boolean }) => [...notificationKeys.lists(), filters] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export function useNotifications(params?: { unread?: boolean }) {
  return useQuery({
    queryKey: notificationKeys.list(params || {}),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params });
      return {
        items: response.data.results || response.data.items || response.data || [],
        count: response.data.count || 0,
      };
    },
    staleTime: 30 * 1000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      return response.data.unread_count || 0;
    },
    refetchInterval: 10000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`${API_ENDPOINTS.NOTIFICATIONS.DETAIL}${id}/`, {
        is_read: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${API_ENDPOINTS.NOTIFICATIONS.DETAIL}${id}/delete/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
