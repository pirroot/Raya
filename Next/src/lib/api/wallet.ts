// lib/api/wallet.ts
import api, { API_ENDPOINTS } from '@/lib/api';
import type { WalletOverviewResponse, WalletTransactionsResponse } from '@/components/panel/types';
import type { WalletTopup, WalletVerify, WalletTransactionsQuery } from '@/lib/validation/wallet';
import {
  walletTopupSchema,
  walletVerifySchema,
  walletTransactionsQuerySchema,
} from '@/lib/validation/wallet';

// Get wallet overview
export async function getWalletOverview(): Promise<WalletOverviewResponse> {
  const response = await api.get(API_ENDPOINTS.WALLET.OVERVIEW);
  return response.data;
}

// Get transactions with pagination
export async function getTransactions(
  params: WalletTransactionsQuery
): Promise<WalletTransactionsResponse> {
  const validated = walletTransactionsQuerySchema.parse(params);

  const searchParams = new URLSearchParams({
    page: String(validated.page),
    limit: String(validated.limit),
  });

  const response = await api.get(`${API_ENDPOINTS.WALLET.TRANSACTIONS}?${searchParams.toString()}`);
  return response.data;
}

// ✅ Topup wallet - استفاده از PAYMENT.REQUEST
export async function topupWallet(
  data: WalletTopup
): Promise<{ success: boolean; authority: string; payment_url: string; payment_id: string }> {
  const validated = walletTopupSchema.parse(data);
  const response = await api.post(API_ENDPOINTS.PAYMENT.REQUEST, validated);
  return response.data;
}

// ✅ Verify payment - استفاده از PAYMENT.VERIFY
export async function verifyPayment(data: WalletVerify): Promise<{
  success: boolean;
  ref_id: string;
  amount: number;
  message: string;
}> {
  const validated = walletVerifySchema.parse(data);
  const response = await api.post(API_ENDPOINTS.PAYMENT.VERIFY, validated);
  return response.data;
}

// Convert coins to wallet
export async function convertCoinsToWallet(
  amount: number
): Promise<{ balance: number; coins: number }> {
  const response = await api.post(API_ENDPOINTS.WALLET.CONVERT, { amount });
  return response.data;
}
