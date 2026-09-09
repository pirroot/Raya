// lib/question-bank/types.ts

export interface Category {
  id: string;
  title: string;
  slug: string;
  icon?: string;
  is_active: boolean;
}

export interface Question {
  id: string;
  user: string;
  user_name: string;
  category: Category;
  category_id: string;
  title: string;
  description: string;
  teacher: string;
  price_type: 'free' | 'paid';
  price: number;
  coin_price: number;
  file: string;
  file_name: string;
  file_size: number;
  file_mime_type: string;
  views: number;
  downloads: number;
  likes: number;
  is_featured: boolean;
  is_approved: boolean;
  is_liked: boolean;
  is_downloaded: boolean;
  isSaved?: boolean; // ✅ برای QuestionCard
  image?: string; // ✅ برای QuestionCard
  oldPrice?: number; // ✅ برای QuestionCard
  rating?: number; // ✅ برای QuestionCard
  reviews?: number; // ✅ برای QuestionCard
  badge?: string; // ✅ برای QuestionCard
  discount?: number; // ✅ برای QuestionCard
  created_at: string;
  updated_at: string;
}

export interface QuestionFilters {
  category?: string;
  price_type?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface DownloadResponse {
  success: boolean;
  already_downloaded: boolean;
  is_first_download: boolean;
  file_url: string;
  coins_spent: number;
  message: string;
}

export interface LikeResponse {
  liked: boolean;
  likes_count: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
