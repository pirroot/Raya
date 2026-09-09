export interface Option {
  id: string;
  label: string;
  score?: number;
  is_correct?: boolean;
}

export interface Question {
  id: string;
  question: string;
  order: number;
  options: Option[];
  type?: 'single' | 'multiple' | 'scale';
  required?: boolean;
}

export interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: string;
  description: string;
  completedAt: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  coin_price: number;
  questions_count: number;
  duration: number;
  level: 'ساده' | 'متوسط' | 'پیشرفته';
  rating: number;
  reviews_count: number;
  isPurchased: boolean;
  isCompleted: boolean;
  createdAt: string;
  image?: string;
  instructions?: string;
  tags?: string[];
  is_free?: boolean;
}

export interface TestPurchaseRequest {
  testId: string;
  paymentMethod: 'wallet' | 'coins';
}

export interface TestSubmitRequest {
  testId: string;
  answers: Record<string, string | string[]>; // questionId: answer
}

export interface TestSubmitResponse {
  success: boolean;
  result: TestResult;
  message?: string;
}
