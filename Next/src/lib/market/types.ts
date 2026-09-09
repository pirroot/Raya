export interface MarketCategory {
  id: string;
  slug: string;
  title: string;
  icon?: string;
  parent?: string | null;
  parentTitle?: string;
  children?: MarketCategory[];
  isActive?: boolean;
  createdAt?: string;
}

export interface AdImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
}

export interface Ad {
  id: string;
  title: string;
  seller_avatar: string;
  description: string;
  buyer_name?: string;
  buyer_phone?: string;
  price: number;
  priceAmount?: number;
  quantity: number;
  condition: 'new' | 'like_new' | 'used' | 'needs_repair';
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'sold';
  seller_name: string;
  seller_phone: string;
  campus?: string;
  location?: string;
  category?: {
    id: string;
    title: string;
    slug: string;
  };
  categoryId?: string;
  image?: string;
  primary_image?: string;
  image_url?: string;
  images: AdImage[];
  views: number;
  isFeatured: boolean;
  isSold: boolean;
  soldAt?: string;
  expiresAt?: string;
  created_at: string;
  has_purchased?: boolean;
  createdAt?: string;
  updatedAt: string;
}

export type MarketProduct = Ad;

export interface CartItem {
  id: string;
  ad: Ad;
  ad_id?: string;
  product?: Ad;
  productId?: string;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalPrice: number;
  total_price?: number;
  itemCount: number;
  item_count?: number;
}

export interface OrderItem {
  seller_phone: string;
  id: string;
  ad: {
    id: string;
    title: string;
  };
  product?: {
    id: string;
    title: string;
  };
  ad_title?: string;
  productTitle?: string;
  quantity: number;
  priceAtTime: number;
  price_at_time?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  order_number?: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: 'wallet' | 'bank';
  payment_method?: 'wallet' | 'bank';
  totalPrice: number;
  total_price?: number;
  discountAmount: number;
  discount_amount?: number;
  finalPrice: number;
  final_price?: number;
  shippingAddress: string;
  shipping_address?: string;
  shippingCost: number;
  shipping_cost?: number;
  couponCode?: string;
  coupon_code?: string;
  items: OrderItem[];
  paidAt?: string;
  paid_at?: string;
  deliveredAt?: string;
  delivered_at?: string;
  createdAt: string;
  created_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  scope: 'all' | 'category' | 'ad';
  scopeId?: string;
  minOrderAmount: number;
  maxDiscountAmount: number;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  isValid?: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface CouponApplyResponse {
  valid: boolean;
  coupon: Coupon;
  discount: number;
}

export interface AdSubmissionData {
  title: string;
  categoryId: string;
  priceAmount: number;
  condition: 'new' | 'like_new' | 'used' | 'needs_repair';
  sellerName: string;
  sellerPhone: string;
  campus?: string;
  description: string;
  images?: File[];
}

export interface CheckoutData {
  address: string;
  paymentMethod: 'wallet' | 'bank';
  couponCode?: string;
  shippingCost?: number;
}
