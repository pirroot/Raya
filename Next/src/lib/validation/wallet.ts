import { z } from 'zod';

// ===== Constants =====
const MIN_WALLET_AMOUNT = 1000;
const MAX_WALLET_AMOUNT = 500_000_000;
const MAX_DESCRIPTION_LENGTH = 255;
const MAX_EMAIL_LENGTH = 120;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

const AUTHORITY_REGEX = /^A[0-9A-Za-z]{10,63}$/;
const MOBILE_REGEX = /^09[0-9]{9}$/;

// ===== Topup =====
export const walletTopupSchema = z
  .object({
    amount: z.coerce
      .number()
      .int()
      .min(MIN_WALLET_AMOUNT)
      .max(MAX_WALLET_AMOUNT),
    description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).optional(),
    mobile: z.string().trim().regex(MOBILE_REGEX).optional(),
    email: z.string().trim().email().max(MAX_EMAIL_LENGTH).optional(),
  })
  .strict();

// ===== Verify =====
export const walletVerifySchema = z
  .object({
    authority: z.string().trim().regex(AUTHORITY_REGEX),
    status: z.enum(['OK', 'NOK']),
    paymentId: z.string().uuid().optional(),
  })
  .strict();

// ===== Transactions Query =====
export const walletTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(DEFAULT_PAGE).default(DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(MIN_LIMIT)
    .max(MAX_LIMIT)
    .default(DEFAULT_LIMIT),
});

// ===== Type Inference =====
export type WalletTopup = z.infer<typeof walletTopupSchema>;
export type WalletVerify = z.infer<typeof walletVerifySchema>;
export type WalletTransactionsQuery = z.infer<
  typeof walletTransactionsQuerySchema
>;
