
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  SAVING = 'SAVING'
}

export interface Transaction {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  currency: 'MMK' | 'THB' | 'USD' | 'SGD';
}

export interface MarketRates {
  THB: number; // 1 THB = ? MMK
  USD: number; // 1 USD = ? MMK
  SGD: number; // 1 SGD = ? MMK
  Gold: number; // 1 Kyattha = ? MMK
}

export interface CalculatorData {
  // Target Planner
  targetAmount: number;
  years: number;
  interestRate: number;
  // FV
  monthlyDeposit: number;
  fvYears: number;
  fvRate: number;
  // Loan
  loanAmount: number;
  loanTermYears: number;
  loanRate: number;
  // Emergency
  monthlyExpense: number;
  fundMonths: number;
}

export interface UserProfile {
  id: string;
  name: string;
  createdAt: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  currency: 'MMK' | 'THB' | 'USD' | 'SGD';
  dayOfMonth: number; // 1-31
  lastProcessedDate?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name or code
  unlocked: boolean;
  color: string;
}

export interface BackupData {
  profile: UserProfile;
  transactions: Transaction[];
  rates: MarketRates;
  calculator: CalculatorData;
  budgets: Budget[];
  recurring: RecurringTransaction[];
  version: string;
}

export interface ExchangeRate {
  from: 'THB' | 'USD' | 'SGD';
  to: 'MMK';
  rate: number;
}
