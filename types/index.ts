export type TransactionCategory =
  | 'Housing'
  | 'Food'
  | 'Transport'
  | 'Entertainment'
  | 'Health'
  | 'Shopping'
  | 'Utilities'
  | 'Personal'
  | 'Other';

export type BillFrequency = 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';

export type CardColor = 'blue' | 'purple' | 'green' | 'red' | 'dark' | 'gold';

export type ActiveSection =
  | 'dashboard'
  | 'credit-cards'
  | 'bills'
  | 'income'
  | 'transactions'
  | 'settings';

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  limit: number;
  color: CardColor;
  lastFour?: string;
}

export interface Transaction {
  id: string;
  cardId?: string;
  amount: number;
  description: string;
  date: string;
  category: TransactionCategory;
  type: 'expense' | 'deposit';
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  lastPaidDate: string;
  frequency: BillFrequency;
  category: TransactionCategory;
}

export interface IncomeEntry {
  id: string;
  amount: number;
  description: string;
  date: string;
  source: string;
}
