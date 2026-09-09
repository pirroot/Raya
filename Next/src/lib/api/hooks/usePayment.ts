// lib/api/hooks/usePayment.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { requestPayment, verifyPayment } from '@/lib/api/payment';
import type { PaymentRequestData } from '@/lib/api/payment';

export function useRequestPayment() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: PaymentRequestData) => requestPayment(data),
    onSuccess: (data) => {
      if (data.success && data.payment_url) {
        // ریدایرکت به درگاه زرین‌پال
        window.location.assign(data.payment_url);
      }
    },
  });
}

export function useVerifyPayment() {
  return useMutation({
    mutationFn: ({ authority, status }: { authority: string; status: string }) =>
      verifyPayment(authority, status),
  });
}
