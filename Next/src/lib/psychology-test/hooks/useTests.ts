'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  Test,
  TestQuestion,
  TestResult,
} from '@/lib/psychology-test/types';

export const testKeys = {
  all: ['psychology-tests'] as const,
  lists: () => [...testKeys.all, 'list'] as const,
  list: (filters: any) => [...testKeys.lists(), filters] as const,
  details: () => [...testKeys.all, 'detail'] as const,
  detail: (id: string) => [...testKeys.details(), id] as const,
  questions: (id: string) => [...testKeys.detail(id), 'questions'] as const,
  results: () => [...testKeys.all, 'results'] as const,
  result: (id: string) => [...testKeys.results(), id] as const,
};

// Get all tests
export function useTests(filters: { search?: string; category?: string } = {}) {
  return useQuery({
    queryKey: testKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      const response = await api.get(
        `/api/psychology-tests?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// Get single test
export function useTest(id: string) {
  return useQuery({
    queryKey: testKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/psychology-tests/${id}`);
      return response.data;
    },
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

// Get test questions
export function useTestQuestions(testId: string) {
  return useQuery({
    queryKey: testKeys.questions(testId),
    queryFn: async () => {
      const response = await api.get(
        `/api/psychology-tests/${testId}/questions`
      );
      return response.data;
    },
    staleTime: 60 * 1000,
    enabled: !!testId,
  });
}

// Submit test answers
export function useSubmitTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      answers,
    }: {
      testId: string;
      answers: number[];
    }) => {
      const response = await api.post(
        `/api/psychology-tests/${testId}/submit`,
        { answers }
      );
      return response.data;
    },
    onSuccess: (data, { testId }) => {
      queryClient.invalidateQueries({ queryKey: testKeys.result(testId) });
      queryClient.invalidateQueries({ queryKey: testKeys.detail(testId) });
    },
  });
}

// Get test result
export function useTestResult(testId: string) {
  return useQuery({
    queryKey: testKeys.result(testId),
    queryFn: async () => {
      const response = await api.get(`/api/psychology-tests/${testId}/result`);
      return response.data;
    },
    staleTime: 60 * 1000,
    enabled: !!testId,
  });
}
