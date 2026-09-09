'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_ENDPOINTS } from '@/lib/api';
import type {
  CoinsTransactionsQuery,
  CoinsSpend,
  CoinsPurchase,
  CoinsConvert,
} from '@/lib/validation/coins';

export const coinsKeys = {
  all: ['coins'] as const,
  balance: () => [...coinsKeys.all, 'balance'] as const,
  transactions: (params?: CoinsTransactionsQuery) =>
    [...coinsKeys.all, 'transactions', params] as const,
};

// ===== Balance =====
export function useCoinsBalance() {
  return useQuery({
    queryKey: coinsKeys.balance(),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.COINS.BALANCE);
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// ===== Transactions =====
export function useCoinsTransactions(params: CoinsTransactionsQuery) {
  return useQuery({
    queryKey: coinsKeys.transactions(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
      });

      if (params.type) searchParams.append('type', params.type);
      if (params.reason) searchParams.append('reason', params.reason);
      if (params.status) searchParams.append('status', params.status);
      if (params.fromDate) searchParams.append('fromDate', params.fromDate);
      if (params.toDate) searchParams.append('toDate', params.toDate);

      const response = await api.get(
        `${API_ENDPOINTS.COINS.TRANSACTIONS}?${searchParams.toString()}`
      );
      return response.data;
    },
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

// ===== Purchase Coins =====
export function usePurchaseCoins() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CoinsPurchase) =>
      api.post(API_ENDPOINTS.COINS.PURCHASE, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinsKeys.balance() });
      queryClient.invalidateQueries({
        queryKey: coinsKeys.transactions({ page: 1, limit: 20 }),
      });
    },
  });
}

// ===== Spend Coins =====
export function useSpendCoins() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CoinsSpend) =>
      api.post(API_ENDPOINTS.COINS.SPEND, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinsKeys.balance() });
      queryClient.invalidateQueries({
        queryKey: coinsKeys.transactions({ page: 1, limit: 20 }),
      });
    },
  });
}

// ===== Convert Coins to Wallet =====
export function useConvertCoins() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CoinsConvert) =>
      api.post(API_ENDPOINTS.COINS.CONVERT, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinsKeys.balance() });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
