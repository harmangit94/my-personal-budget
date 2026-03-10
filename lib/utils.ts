import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  addWeeks,
  addMonths,
  addYears,
  format,
  isThisWeek,
  differenceInDays,
  parseISO,
} from 'date-fns';
import type { Bill, BillFrequency } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getNextDueDate(bill: Bill): Date {
  const last = parseISO(bill.lastPaidDate);
  switch (bill.frequency) {
    case 'weekly':    return addWeeks(last, 1);
    case 'bi-weekly': return addWeeks(last, 2);
    case 'monthly':   return addMonths(last, 1);
    case 'quarterly': return addMonths(last, 3);
    case 'yearly':    return addYears(last, 1);
  }
}

export function getDaysUntilDue(bill: Bill): number {
  return differenceInDays(getNextDueDate(bill), new Date());
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

export function isThisWeekEntry(dateString: string): boolean {
  return isThisWeek(parseISO(dateString), { weekStartsOn: 1 });
}

export function getCardGradient(color: string): string {
  const map: Record<string, string> = {
    blue:   'from-blue-600 via-blue-700 to-blue-900',
    purple: 'from-purple-600 via-purple-700 to-pink-800',
    green:  'from-emerald-500 via-teal-600 to-teal-800',
    red:    'from-rose-500 via-red-600 to-orange-700',
    dark:   'from-gray-700 via-gray-800 to-gray-900',
    gold:   'from-yellow-500 via-amber-600 to-amber-800',
  };
  return map[color] ?? map.blue;
}

export const CATEGORIES = [
  'Housing', 'Food', 'Transport', 'Entertainment',
  'Health', 'Shopping', 'Utilities', 'Personal', 'Other',
] as const;

export const CARD_COLORS = ['blue', 'purple', 'green', 'red', 'dark', 'gold'] as const;

export const BILL_FREQUENCIES: BillFrequency[] = [
  'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly',
];

export const CATEGORY_COLORS: Record<string, string> = {
  Housing:       '#6366f1',
  Food:          '#f59e0b',
  Transport:     '#3b82f6',
  Entertainment: '#ec4899',
  Health:        '#10b981',
  Shopping:      '#8b5cf6',
  Utilities:     '#f97316',
  Personal:      '#06b6d4',
  Other:         '#6b7280',
};
