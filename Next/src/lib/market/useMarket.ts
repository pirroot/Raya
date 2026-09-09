import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_ENDPOINTS } from '@/lib/api';
import type { Ad, Cart, Order, CouponApplyResponse, CheckoutData } from '@/lib/market/types';

interface ProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  condition?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  featured?: boolean;
  is_sold?: boolean;
  status?: string;
}

export function useMarketProducts(params?: ProductsParams) {
  return useQuery({
    queryKey: ['market-products', params],
    queryFn: async () => {
      const cleanParams: Record<string, any> = {};

      if (params?.page) cleanParams.page = params.page;
      if (params?.limit) cleanParams.limit = params.limit;
      if (params?.search) cleanParams.search = params.search;
      if (params?.categoryId) cleanParams.category = params.categoryId;
      if (params?.condition && params.condition !== 'all') cleanParams.condition = params.condition;
      if (params?.sortBy) cleanParams.sortBy = params.sortBy;
      if (params?.featured) cleanParams.featured = params.featured;
      if (params?.is_sold !== undefined) cleanParams.is_sold = params.is_sold;
      if (params?.status) cleanParams.status = params.status;

      const response = await api.get(API_ENDPOINTS.MARKET.ADS, { params: cleanParams });

      return {
        items: response.data.results || response.data.items || response.data || [],
        count: response.data.count || 0,
        totalPages:
          response.data.total_pages || Math.ceil((response.data.count || 0) / (params?.limit || 8)),
        currentPage: response.data.current_page || params?.page || 1,
        hasMore: !!response.data.next,
        next: response.data.next,
        previous: response.data.previous,
      };
    },
    staleTime: 60 * 1000,
  });
}

export function useProductDetail(productId: string) {
  return useQuery({
    queryKey: ['market-product', productId],
    queryFn: async () => {
      const response = await api.get(`${API_ENDPOINTS.MARKET.ADS}${productId}/`);
      return response.data as Ad;
    },
    enabled: !!productId,
  });
}

export function useMyProducts() {
  return useQuery({
    queryKey: ['my-products'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.MARKET.MY_ADS);
      return {
        items: response.data.results || response.data.items || response.data || [],
      };
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post(API_ENDPOINTS.MARKET.ADS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as Ad;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-products'] });
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData | Record<string, any> }) => {
      const isFormData = data instanceof FormData;
      const response = await api.put(`${API_ENDPOINTS.MARKET.ADS}${id}/`, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data as Ad;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-products'] });
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['market-product'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${API_ENDPOINTS.MARKET.ADS}${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-products'] });
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
    },
  });
}

// ===== SUBMIT AD =====
export function useSubmitAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post(API_ENDPOINTS.MARKET.ADS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as Ad;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-products'] });
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
    },
  });
}

// ===== CART =====
export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.MARKET.CART);
      return {
        id: response.data.id,
        items: response.data.items || [],
        totalPrice: response.data.total_price || response.data.totalPrice || 0,
        itemCount: response.data.item_count || response.data.itemCount || 0,
      } as Cart;
    },
    staleTime: 30 * 1000,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ adId, quantity = 1 }: { adId: string; quantity?: number }) => {
      const response = await api.post(API_ENDPOINTS.MARKET.CART_ADD, {
        ad_id: adId,
        quantity,
      });
      return response.data as Cart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await api.put(`${API_ENDPOINTS.MARKET.CART_ITEMS}${itemId}/`, { quantity });
      return response.data as Cart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`${API_ENDPOINTS.MARKET.CART_ITEMS}${itemId}/remove/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(API_ENDPOINTS.MARKET.CART_CLEAR);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// ===== ORDERS =====
export function useOrders(status?: string) {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: async () => {
      const params = status ? { status } : {};
      const response = await api.get(API_ENDPOINTS.MARKET.ORDERS, { params });
      return {
        items: response.data.results || response.data.items || response.data || [],
        count: response.data.count || 0,
      };
    },
  });
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await api.get(`${API_ENDPOINTS.MARKET.ORDERS}${orderId}/`);
      return response.data as Order;
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CheckoutData) => {
      const response = await api.post(API_ENDPOINTS.MARKET.ORDERS, {
        address: data.address,
        payment_method: data.paymentMethod,
        coupon_code: data.couponCode || '',
        shipping_cost: data.shippingCost || 0,
      });
      return response.data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.delete(`${API_ENDPOINTS.MARKET.ORDERS}${orderId}/`);
      return response.data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
  });
}

// ===== COUPONS =====
export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.MARKET.COUPONS);
      return {
        items: response.data.results || response.data.items || response.data || [],
      };
    },
  });
}

export function useApplyCoupon() {
  return useMutation({
    mutationFn: async ({ code, amount }: { code: string; amount: number }) => {
      const response = await api.post(API_ENDPOINTS.MARKET.COUPON_APPLY, { code, amount });
      return response.data as CouponApplyResponse;
    },
  });
}

// ===== CATEGORIES =====
export function useCategories(parentId?: string) {
  return useQuery({
    queryKey: ['market-categories', parentId],
    queryFn: async () => {
      const params = parentId ? { parent: parentId } : {};
      const response = await api.get(API_ENDPOINTS.MARKET.CATEGORIES, { params });
      return {
        items: response.data.results || response.data.items || response.data || [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
