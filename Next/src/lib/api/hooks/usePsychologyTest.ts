'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_ENDPOINTS } from '@/lib/api';

// ===== Types =====

export interface TestOption {
  id: string;
  label: string;
  score?: number;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: TestOption[];
}

export interface PsychologyTest {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  coin_price: number;
  questions_count: number;
  duration: number;
  level: 'simple' | 'medium' | 'advanced';
  rating: number;
  reviews: number;
  is_purchased: boolean;
  is_completed: boolean;
  created_at: string;
}

export interface TestResult {
  id: string;
  test: PsychologyTest;
  score: number;
  total_questions: number;
  percentage: number;
  answers: {
    question_id: string;
    question: string;
    selected_option: string;
    is_correct: boolean;
  }[];
  started_at: string;
  completed_at: string;
}

export interface SubmitAnswerPayload {
  question_id: string;
  option_id: string;
}

export interface CompleteTestPayload {
  answers: SubmitAnswerPayload[];
}

// ===== Query Keys =====

export const testKeys = {
  all: ['psychology-tests'] as const,
  lists: () => [...testKeys.all, 'list'] as const,
  list: (params?: any) => [...testKeys.lists(), params] as const,
  details: () => [...testKeys.all, 'detail'] as const,
  detail: (id: string) => [...testKeys.details(), id] as const,
  questions: (id: string) => [...testKeys.detail(id), 'questions'] as const,
  result: (id: string) => [...testKeys.detail(id), 'result'] as const,
  results: () => [...testKeys.all, 'results'] as const,
};

// ===== Hooks =====

// لیست تست‌ها
export function useTests(params?: { category?: string; search?: string }) {
  return useQuery<PsychologyTest[]>({
    queryKey: testKeys.list(params),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.PSYCHOLOGY_TESTS.LIST, { params });
      return response.data?.results || [];
    },
    staleTime: 60 * 1000,
  });
}

// جزئیات تست
export function useTest(id: string) {
  return useQuery<PsychologyTest>({
    queryKey: testKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.PSYCHOLOGY_TESTS.DETAIL(id));
      return response.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// سوالات تست
export function useTestQuestions(id: string) {
  return useQuery<TestQuestion[]>({
    queryKey: testKeys.questions(id),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.PSYCHOLOGY_TESTS.QUESTIONS(id));
      return response.data?.results || [];
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// نتیجه تست
export function useTestResult(id: string) {
  return useQuery<TestResult>({
    queryKey: testKeys.result(id),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.PSYCHOLOGY_TESTS.RESULT(id));
      return response.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// لیست نتایج کاربر
export function useMyTestResults() {
  return useQuery<TestResult[]>({
    queryKey: testKeys.results(),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.PSYCHOLOGY_TESTS.MY_RESULTS);
      return response.data?.results || [];
    },
    staleTime: 60 * 1000,
  });
}

// ===== Mutations =====

// ارسال پاسخ‌ها و تکمیل تست
export function useCompleteTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ testId, data }: { testId: string; data: CompleteTestPayload }) => {
      const response = await api.post(API_ENDPOINTS.PSYCHOLOGY_TESTS.COMPLETE(testId), data);
      return response.data;
    },
    onSuccess: (_, { testId }) => {
      queryClient.invalidateQueries({ queryKey: testKeys.result(testId) });
      queryClient.invalidateQueries({ queryKey: testKeys.detail(testId) });
      queryClient.invalidateQueries({ queryKey: testKeys.results() });
    },
  });
}

// خرید تست (با سکه یا پول)
export function usePurchaseTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      paymentMethod,
    }: {
      testId: string;
      paymentMethod: 'coin' | 'wallet';
    }) => {
      const response = await api.post(API_ENDPOINTS.PSYCHOLOGY_TESTS.PURCHASE(testId), {
        payment_method: paymentMethod,
      });
      return response.data;
    },
    onSuccess: (_, { testId }) => {
      queryClient.invalidateQueries({ queryKey: testKeys.detail(testId) });
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
    },
  });
}
