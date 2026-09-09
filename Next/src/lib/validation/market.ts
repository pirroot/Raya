import { z } from 'zod';

export const adSubmissionSchema = z.object({
  title: z.string().min(3, 'عنوان حداقل ۳ کاراکتر').max(100, 'عنوان حداکثر ۱۰۰ کاراکتر'),

  categoryId: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),

  priceAmount: z.number().min(1000, 'قیمت حداقل ۱۰۰۰ تومان'),

  quantity: z.number().min(1, 'حداقل تعداد ۱ است').max(999, 'حداکثر تعداد ۹۹۹ است').default(1),

  condition: z.enum(['new', 'like_new', 'used', 'needs_repair'], {
    errorMap: () => ({ message: 'وضعیت کالا را انتخاب کنید' }),
  }),

  sellerName: z
    .string()
    .min(2, 'نام فروشنده را وارد کنید')
    .max(100, 'نام فروشنده حداکثر ۱۰۰ کاراکتر'),

  sellerPhone: z
    .string()
    .min(10, 'شماره تماس معتبر وارد کنید')
    .max(15, 'شماره تماس حداکثر ۱۵ کاراکتر')
    .regex(/^[0-9]+$/, 'شماره تماس فقط شامل اعداد باشد'),

  campus: z.string().max(100, 'نام دانشگاه حداکثر ۱۰۰ کاراکتر').optional().default(''),

  description: z
    .string()
    .min(10, 'توضیحات حداقل ۱۰ کاراکتر')
    .max(1000, 'توضیحات حداکثر ۱۰۰۰ کاراکتر'),

  images: z.array(z.instanceof(File)).max(3, 'حداکثر 3 تصویر مجاز است').optional().default([]),
});

export type AdSubmission = z.infer<typeof adSubmissionSchema>;

export const checkoutSchema = z.object({
  address: z.string().min(5, 'آدرس را وارد کنید').max(500, 'آدرس حداکثر ۵۰۰ کاراکتر'),

  paymentMethod: z.enum(['wallet', 'bank'], {
    errorMap: () => ({ message: 'روش پرداخت را انتخاب کنید' }),
  }),

  couponCode: z.string().max(50, 'کد تخفیف حداکثر ۵۰ کاراکتر').optional().default(''),

  shippingCost: z.number().min(0, 'هزینه ارسال نمی‌تواند منفی باشد').default(0),
});

export type CheckoutForm = z.infer<typeof checkoutSchema>;

export const cartItemSchema = z.object({
  adId: z.string().min(1, 'شناسه آگهی را وارد کنید'),
  quantity: z.number().min(1, 'حداقل تعداد ۱ است').max(999, 'حداکثر تعداد ۹۹۹ است'),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const walletTopupSchema = z.object({
  amount: z
    .number()
    .min(1000, 'حداقل مبلغ شارژ ۱۰۰۰ تومان است')
    .max(50000000, 'حداکثر مبلغ شارژ ۵۰ میلیون تومان است'),
});

export type WalletTopup = z.infer<typeof walletTopupSchema>;

export const walletVerifySchema = z.object({
  authority: z.string().min(1, 'کد پرداخت را وارد کنید'),
  orderId: z.string().optional(),
});

export type WalletVerify = z.infer<typeof walletVerifySchema>;

export const walletTransactionsQuerySchema = z.object({
  page: z.number().min(1, 'شماره صفحه باید حداقل ۱ باشد').default(1),
  limit: z
    .number()
    .min(1, 'تعداد آیتم در صفحه باید حداقل ۱ باشد')
    .max(100, 'تعداد آیتم در صفحه حداکثر ۱۰۰ است')
    .default(20),
});

export type WalletTransactionsQuery = z.infer<typeof walletTransactionsQuerySchema>;
