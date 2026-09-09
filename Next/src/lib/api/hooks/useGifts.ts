// lib/api/hooks/useGifts.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { API_ENDPOINTS } from '@/lib/api';
import toast from 'react-hot-toast';

export interface Gift {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'gift' | 'voucher';
  discount_type: 'percent' | 'amount';
  discount_type_display: string;
  discount_value: number;
  code: string;
  expires_at: string;
  is_active: boolean;
  is_used_by_user: boolean;
  is_expired: boolean;
  used_count: number;
  max_uses_per_user: number;
  max_uses_total: number;
  applies_to: 'all' | 'market' | 'courses' | 'books';
  applies_to_display: string;
  created_at: string;
}

export interface GiftUsage {
  id: string;
  user: string;
  user_mobile: string;
  gift: string;
  gift_title: string;
  gift_code: string;
  order_id: string;
  order_type: string;
  discounted_amount: number;
  used_at: string;
}

export interface GiftValidateRequest {
  code: string;
  total_amount: number;
  order_type?: 'all' | 'market' | 'courses' | 'books';
}

export interface GiftValidateResponse {
  valid: boolean;
  message: string;
  gift?: Gift;
  discount?: number;
  final_amount?: number;
  discount_type?: string;
  discount_value?: number;
}

export interface GiftApplyRequest {
  code: string;
  total_amount: number;
  order_type: 'all' | 'market' | 'courses' | 'books';
  order_id?: string;
}

export interface GiftApplyResponse {
  success: boolean;
  message: string;
  discount: number;
  final_amount: number;
  usage: GiftUsage;
}

// ===== GET: لیست هدیه‌ها =====
export function useGifts() {
  return useQuery({
    queryKey: ['gifts'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.GIFTS.LIST);
      return (response.data?.results as Gift[]) || [];
    },
  });
}

// ===== GET: هدیه‌های استفاده شده توسط کاربر =====
export function useMyGifts() {
  return useQuery({
    queryKey: ['my-gifts'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.GIFTS.MY);
      return (response.data?.results as GiftUsage[]) || [];
    },
  });
}

// ===== POST: اعتبارسنجی کد تخفیف =====
export function useValidateGift() {
  return useMutation({
    mutationFn: async (data: GiftValidateRequest) => {
      const response = await api.post(API_ENDPOINTS.GIFTS.VALIDATE, data);
      return response.data as GiftValidateResponse;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در اعتبارسنجی کد تخفیف');
    },
  });
}

// ===== POST: اعمال کد تخفیف =====
export function useApplyGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GiftApplyRequest) => {
      const response = await api.post(API_ENDPOINTS.GIFTS.APPLY, data);
      return response.data as GiftApplyResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-gifts'] });
      toast.success('کد تخفیف با موفقیت اعمال شد');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'خطا در اعمال کد تخفیف');
    },
  });
}

// ===== POST: استفاده از هدیه (قدیمی) =====
export function useRedeemGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post(API_ENDPOINTS.GIFTS.REDEEM, { code });
      return response.data as GiftUsage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      queryClient.invalidateQueries({ queryKey: ['my-gifts'] });
      toast.success('هدیه با موفقیت استفاده شد');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'خطا در استفاده از هدیه');
    },
  });
}
