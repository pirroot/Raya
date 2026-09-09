export interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  questions: number;
  duration: number;
  level: 'ساده' | 'متوسط' | 'پیشرفته';
  image?: string;
  rating: number;
  reviews: number;
  isPurchased?: boolean;
  createdAt: string;
}

export interface TestQuestion {
  id: string;
  testId: string;
  question: string;
  options: string[];
  correctAnswer?: number;
}

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  score: number;
  total: number;
  answers: number[];
  createdAt: string;
}
