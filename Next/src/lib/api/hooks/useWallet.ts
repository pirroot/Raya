'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWalletOverview,
  getTransactions,
  topupWallet,
  verifyPayment,
  convertCoinsToWallet,
} from '@/lib/api/wallet';
import type { WalletTopup, WalletVerify, WalletTransactionsQuery } from '@/lib/validation/wallet';
import type { WalletOverviewResponse, WalletTransactionsResponse } from '@/components/panel/types';

export const walletKeys = {
  all: ['wallet'] as const,
  overview: () => [...walletKeys.all, 'overview'] as const,
  transactions: (params: WalletTransactionsQuery) =>
    [...walletKeys.all, 'transactions', params] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
};

// ===== Get wallet overview =====
export function useWalletOverview() {
  return useQuery<WalletOverviewResponse>({
    queryKey: walletKeys.overview(),
    queryFn: getWalletOverview,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// ===== Get wallet balance =====
export function useWalletBalance() {
  return useQuery<number>({
    queryKey: walletKeys.balance(),
    queryFn: async () => {
      const response = await getWalletOverview();
      return response.balance || 0;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// ===== Get transactions =====
export function useTransactions(params: WalletTransactionsQuery) {
  return useQuery<WalletTransactionsResponse>({
    queryKey: walletKeys.transactions(params),
    queryFn: () => getTransactions(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

// ===== Topup wallet (Zarinpal) =====
export function useTopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WalletTopup) => topupWallet(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.overview() });
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      if (data.payment_url) {
        window.location.assign(data.payment_url);
      }
    },
    onError: (error: any) => {
      console.error('Topup error:', error);
    },
  });
}

// ===== Verify payment (callback) =====
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WalletVerify) => verifyPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.overview() });
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({
        queryKey: walletKeys.transactions({ page: 1, limit: 20 }),
      });
    },
  });
}

// ===== Convert coins to wallet =====
export function useConvertCoins() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => convertCoinsToWallet(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.overview() });
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: ['coins'] });
    },
  });
}

// ===== Get wallet stats =====
export function useWalletStats() {
  return useQuery({
    queryKey: [...walletKeys.all, 'stats'] as const,
    queryFn: async () => {
      const response = await getWalletOverview();
      return {
        balance: response.balance || 0,
      };
    },
    staleTime: 30 * 1000,
  });
}
