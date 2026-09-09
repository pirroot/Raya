'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_ENDPOINTS, resolveBackendUrl } from '@/lib/api';
import type {
  Question,
  QuestionFilters,
  DownloadResponse,
  LikeResponse,
  Category,
} from '@/lib/question-bank/types';

export const questionKeys = {
  all: ['questions'] as const,
  lists: () => [...questionKeys.all, 'list'] as const,
  list: (filters: QuestionFilters) => [...questionKeys.lists(), filters] as const,
  details: () => [...questionKeys.all, 'detail'] as const,
  detail: (id: string) => [...questionKeys.details(), id] as const,
};

// ===== Get Categories =====
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['question-categories'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.QUESTION_BANK.CATEGORIES);
      const data = response.data;

      if (Array.isArray(data)) {
        return data;
      }

      if (data && Array.isArray(data.results)) {
        return data.results;
      }

      return [];
    },
    staleTime: 60 * 1000,
  });
}

// ===== Get Questions =====
export function useQuestions(filters: QuestionFilters = {}) {
  return useQuery<Question[]>({
    queryKey: questionKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.price_type) params.append('price_type', filters.price_type);

      const response = await api.get(
        `${API_ENDPOINTS.QUESTION_BANK.QUESTIONS}?${params.toString()}`
      );

      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data && Array.isArray(data.results)) {
        return data.results;
      }
      return [];
    },
    staleTime: 60 * 1000,
  });
}

// ===== Get Single Question =====
export function useQuestion(id: string) {
  return useQuery<Question>({
    queryKey: questionKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.QUESTION_BANK.QUESTION_DETAIL(id));
      return response.data;
    },
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

// ===== Like Question =====
export function useLikeQuestion() {
  const queryClient = useQueryClient();

  return useMutation<LikeResponse, Error, string>({
    mutationFn: async (id: string) => {
      const response = await api.post(API_ENDPOINTS.QUESTION_BANK.LIKE(id));
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
    },
  });
}

// ===== Download Question =====
export function useDownloadQuestion() {
  const queryClient = useQueryClient();

  return useMutation<DownloadResponse, Error, string>({
    mutationFn: async (id: string) => {
      const response = await api.post(API_ENDPOINTS.QUESTION_BANK.DOWNLOAD(id));
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });

      // ===== استفاده از resolveBackendUrl برای تصحیح آدرس =====
      if (data.success && data.file_url) {
        const fullUrl = resolveBackendUrl(data.file_url);
        window.open(fullUrl, '_blank');
      }
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        const message = error.response?.data?.error || '';
        if (message.includes('سکه')) {
          window.location.href = '/panel/coins';
        }
      }
    },
  });
}

// ===== Upload Question =====
export function useUploadQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const token = localStorage.getItem('access_token');
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${baseURL}${API_ENDPOINTS.QUESTION_BANK.CREATE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'خطا در آپلود');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
    },
  });
}
