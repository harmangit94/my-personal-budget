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

export type AccountType = 'checking' | 'savings' | 'cash';

export type ActiveSection =
  | 'dashboard'
  | 'credit-cards'
  | 'accounts'
  | 'bills'
  | 'income'
  | 'expenses'
  | 'settings';

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  limit: number;
  color: CardColor;
  lastFour?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  accountType: AccountType;
  color: CardColor;
}

export interface Transaction {
  id: string;
  cardId?: string;
  accountId?: string;
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
  cardId?: string;
  accountId?: string;
}

export interface IncomeEntry {
  id: string;
  amount: number;
  description: string;
  date: string;
  source: string;
}
