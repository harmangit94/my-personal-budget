import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreditCard, Transaction, Bill, IncomeEntry } from '@/types';

interface BudgetStore {
  creditCards: CreditCard[];
  transactions: Transaction[];
  bills: Bill[];
  incomeEntries: IncomeEntry[];

  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  removeCreditCard: (id: string) => void;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;

  addBill: (bill: Omit<Bill, 'id'>) => void;
  removeBill: (id: string) => void;
  markBillAsPaid: (id: string) => void;

  addIncomeEntry: (entry: Omit<IncomeEntry, 'id'>) => void;
  removeIncomeEntry: (id: string) => void;

  exportData: () => void;
  clearAllData: () => void;
}

const uid = () => crypto.randomUUID();

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      creditCards: [],
      transactions: [],
      bills: [],
      incomeEntries: [],

      addCreditCard: (card) =>
        set((s) => ({ creditCards: [...s.creditCards, { ...card, id: uid() }] })),

      removeCreditCard: (id) =>
        set((s) => ({
          creditCards: s.creditCards.filter((c) => c.id !== id),
          transactions: s.transactions.filter((t) => t.cardId !== id),
        })),

      updateCreditCard: (id, updates) =>
        set((s) => ({
          creditCards: s.creditCards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      addTransaction: (transaction) => {
        const id = uid();
        set((s) => {
          const newTransactions = [...s.transactions, { ...transaction, id }];
          let newCards = s.creditCards;
          if (transaction.cardId) {
            newCards = s.creditCards.map((card) => {
              if (card.id !== transaction.cardId) return card;
              const delta =
                transaction.type === 'expense' ? transaction.amount : -transaction.amount;
              return { ...card, balance: Math.max(0, card.balance + delta) };
            });
          }
          return { transactions: newTransactions, creditCards: newCards };
        });
      },

      removeTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id);
        set((s) => {
          let newCards = s.creditCards;
          if (tx?.cardId) {
            newCards = s.creditCards.map((card) => {
              if (card.id !== tx.cardId) return card;
              const delta = tx.type === 'expense' ? -tx.amount : tx.amount;
              return { ...card, balance: Math.max(0, card.balance + delta) };
            });
          }
          return {
            transactions: s.transactions.filter((t) => t.id !== id),
            creditCards: newCards,
          };
        });
      },

      addBill: (bill) =>
        set((s) => ({ bills: [...s.bills, { ...bill, id: uid() }] })),

      removeBill: (id) =>
        set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),

      markBillAsPaid: (id) =>
        set((s) => ({
          bills: s.bills.map((b) =>
            b.id === id ? { ...b, lastPaidDate: new Date().toISOString() } : b
          ),
        })),

      addIncomeEntry: (entry) =>
        set((s) => ({ incomeEntries: [...s.incomeEntries, { ...entry, id: uid() }] })),

      removeIncomeEntry: (id) =>
        set((s) => ({ incomeEntries: s.incomeEntries.filter((e) => e.id !== id) })),

      exportData: () => {
        const s = get();
        const data = {
          creditCards: s.creditCards,
          transactions: s.transactions,
          bills: s.bills,
          incomeEntries: s.incomeEntries,
          exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      clearAllData: () =>
        set({ creditCards: [], transactions: [], bills: [], incomeEntries: [] }),
    }),
    { name: 'personal-budget-store' }
  )
);
