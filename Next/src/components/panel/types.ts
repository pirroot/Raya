export type EducationLevel = 'diploma' | 'associate' | 'bachelor' | 'master' | 'phd';

export interface EducationOption {
  value: EducationLevel;
  label: string;
}

// ===== Profile Types =====
export interface ProfileFormValues {
  avatarUrl: string | null;
  avatarFile?: File | null;
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
}

export interface AdditionalInfoFormValues {
  studentCode: string;
  birthDate: string;
  educationLevel: EducationLevel;
}

// ===== Wallet Types =====
export type WalletTransactionType = 'credit' | 'debit' | 'refund' | 'adjustment';
export type WalletTransactionStatus = 'pending' | 'committed' | 'reversed' | 'failed';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  currency: string;
  description: string | null;
  reference: string | null;
  createdAt: string;
}

export interface WalletOverviewResponse {
  balance: number;
  pendingAmount: number;
  currency: string;
}

export interface WalletTransactionsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: WalletTransaction[];
}

// ===== Old/Deprecated Types (Keep for backward compatibility) =====
export type TransactionType = 'deposit' | 'purchase' | 'conversion';
export type TransactionStatus = 'success' | 'pending' | 'failed';

export interface PanelDashboardData {
  profile: ProfileFormValues;
  additionalInfo: AdditionalInfoFormValues;
  educationLevelOptions: EducationOption[];
  walletBalance: number;
  coinsBalance: number;
  coinConversionRate: number;
  transactions: WalletTransaction[];
}
