import { z } from 'zod';

// ===== Constants =====
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1_000_000;
const MAX_REASON_NOTE_LENGTH = 255;
const MAX_REFERENCE_LENGTH = 120;
const MAX_PAYMENT_REFERENCE_LENGTH = 180;
const MAX_NOTE_LENGTH = 255;

// ===== Reason Types =====
export const coinReasonEnum = z.enum([
  'reward',
  'spend',
  'purchase',
  'adjustment',
  'refund',
]);
export const coinTypeEnum = z.enum(['credit', 'debit']);
export const coinStatusEnum = z.enum([
  'pending',
  'committed',
  'failed',
  'reverted',
]);

export type CoinReason = z.infer<typeof coinReasonEnum>;
export type CoinType = z.infer<typeof coinTypeEnum>;
export type CoinStatus = z.infer<typeof coinStatusEnum>;

// ===== Transactions Query =====
export const coinsTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(DEFAULT_PAGE).default(DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(MIN_LIMIT)
    .max(MAX_LIMIT)
    .default(DEFAULT_LIMIT),
  type: coinTypeEnum.optional(),
  reason: coinReasonEnum.optional(),
  status: coinStatusEnum.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

// ===== Spend Coins =====
export const coinsSpendSchema = z
  .object({
    amount: z.coerce
      .number()
      .int()
      .min(MIN_AMOUNT, `حداقل ${MIN_AMOUNT} سکه`)
      .max(MAX_AMOUNT, `حداکثر ${MAX_AMOUNT} سکه`),
    reason: coinReasonEnum.default('spend'),
    reason_note: z.string().trim().max(MAX_REASON_NOTE_LENGTH).optional(),
    reference: z.string().trim().max(MAX_REFERENCE_LENGTH).optional(),
  })
  .strict();

// ===== Purchase Coins =====
export const coinsPurchaseSchema = z
  .object({
    amount: z.coerce
      .number()
      .int()
      .min(MIN_AMOUNT, `حداقل ${MIN_AMOUNT} سکه`)
      .max(MAX_AMOUNT, `حداکثر ${MAX_AMOUNT} سکه`),
    packageId: z.string().uuid().optional(),
    paymentReference: z
      .string()
      .trim()
      .max(MAX_PAYMENT_REFERENCE_LENGTH)
      .optional(),
    note: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
  })
  .strict();

// ===== Convert Coins to Wallet =====
export const coinsConvertSchema = z
  .object({
    amount: z.coerce
      .number()
      .int()
      .min(10, 'حداقل ۱۰ سکه قابل تبدیل است')
      .max(500, 'حداکثر ۵۰۰ سکه در روز قابل تبدیل است'),
  })
  .strict();

// ===== Type Inference =====
export type CoinsTransactionsQuery = z.infer<
  typeof coinsTransactionsQuerySchema
>;
export type CoinsSpend = z.infer<typeof coinsSpendSchema>;
export type CoinsPurchase = z.infer<typeof coinsPurchaseSchema>;
export type CoinsConvert = z.infer<typeof coinsConvertSchema>;
