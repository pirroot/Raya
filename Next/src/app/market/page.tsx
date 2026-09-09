import { MarketDashboard } from '@/components/market/MarketDashboard';
import type { MarketCategory, MarketProduct } from '@/lib/market/types';
import { API_BASE_URL } from '@/lib/api';

async function getCategories(): Promise<MarketCategory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/market/categories/`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data.items || data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function getProducts(): Promise<MarketProduct[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/market/ads/`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data.items || data || [];
  } catch (error) {
    console.error('Error fetching ads:', error);
    return [];
  }
}

export default async function MarketPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return <MarketDashboard initialProducts={products} categories={categories} />;
}
