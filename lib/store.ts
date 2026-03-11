import { create } from 'zustand';
import { supabase } from './supabase';
import { toast } from 'sonner';
import type { CreditCard, Account, Transaction, Bill, IncomeEntry } from '@/types';

const uid = () => crypto.randomUUID();

/* ── DB row → TypeScript mappers ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toCard = (r: any): CreditCard => ({
  id: r.id, name: r.name, balance: r.balance,
  limit: r.credit_limit, color: r.color, lastFour: r.last_four ?? undefined,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toAccount = (r: any): Account => ({
  id: r.id, name: r.name, balance: r.balance,
  accountType: r.account_type, color: r.color,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toTx = (r: any): Transaction => ({
  id: r.id, cardId: r.card_id ?? undefined, accountId: r.account_id ?? undefined,
  amount: r.amount, description: r.description, date: r.date,
  category: r.category, type: r.type,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toBill = (r: any): Bill => ({
  id: r.id, name: r.name, amount: r.amount,
  lastPaidDate: r.last_paid_date, frequency: r.frequency, category: r.category,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toIncome = (r: any): IncomeEntry => ({
  id: r.id, amount: r.amount, description: r.description,
  date: r.date, source: r.source ?? '',
});

interface BudgetStore {
  creditCards: CreditCard[];
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
  incomeEntries: IncomeEntry[];
  userId: string | null;
  loading: boolean;

  setUserId: (id: string | null) => void;
  loadFromSupabase: (userId: string) => Promise<void>;
  clearLocalState: () => void;

  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCreditCard: (id: string, updates: Partial<Omit<CreditCard, 'id'>>) => void;
  removeCreditCard: (id: string) => void;

  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id'>>) => void;
  removeAccount: (id: string) => void;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;

  addBill: (bill: Omit<Bill, 'id'>) => void;
  removeBill: (id: string) => void;
  markBillAsPaid: (id: string) => void;

  addIncomeEntry: (entry: Omit<IncomeEntry, 'id'>) => void;
  removeIncomeEntry: (id: string) => void;

  exportData: () => void;
  clearAllData: () => Promise<void>;
}

export const useBudgetStore = create<BudgetStore>()((set, get) => ({
  creditCards: [],
  accounts: [],
  transactions: [],
  bills: [],
  incomeEntries: [],
  userId: null,
  loading: false,

  setUserId: (id) => set({ userId: id }),

  clearLocalState: () => set({
    creditCards: [], accounts: [], transactions: [], bills: [], incomeEntries: [], userId: null,
  }),

  loadFromSupabase: async (userId) => {
    set({ loading: true, userId });
    const [cards, accountsRes, txns, billsRes, incomeRes] = await Promise.all([
      supabase.from('credit_cards').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('bills').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('income_entries').select('*').eq('user_id', userId).order('date', { ascending: false }),
    ]);
    set({
      creditCards:   (cards.data       ?? []).map(toCard),
      accounts:      (accountsRes.data ?? []).map(toAccount),
      transactions:  (txns.data        ?? []).map(toTx),
      bills:         (billsRes.data    ?? []).map(toBill),
      incomeEntries: (incomeRes.data   ?? []).map(toIncome),
      loading: false,
    });
  },

  /* ── Credit Cards ── */
  addCreditCard: (card) => {
    const id = uid();
    const newCard: CreditCard = { ...card, id };
    set((s) => ({ creditCards: [...s.creditCards, newCard] }));
    const uid_ = get().userId;
    if (uid_) {
      supabase.from('credit_cards').insert({
        id, user_id: uid_, name: card.name, balance: card.balance,
        credit_limit: card.limit, color: card.color, last_four: card.lastFour ?? null,
      }).then(({ error }) => { if (error) toast.error('Failed to save card'); });
    }
  },

  updateCreditCard: (id, updates) => {
    set((s) => ({
      creditCards: s.creditCards.map((c) => c.id === id ? { ...c, ...updates } : c),
    }));
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.limit !== undefined) dbUpdates.credit_limit = updates.limit;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.lastFour !== undefined) dbUpdates.last_four = updates.lastFour ?? null;
    supabase.from('credit_cards').update(dbUpdates).eq('id', id)
      .then(({ error }) => { if (error) toast.error('Failed to update card'); });
  },

  removeCreditCard: (id) => {
    set((s) => ({
      creditCards: s.creditCards.filter((c) => c.id !== id),
      transactions: s.transactions.filter((t) => t.cardId !== id),
    }));
    supabase.from('credit_cards').delete().eq('id', id)
      .then(({ error }) => { if (error) toast.error('Failed to remove card'); });
  },

  /* ── Accounts ── */
  addAccount: (account) => {
    const id = uid();
    const newAccount: Account = { ...account, id };
    set((s) => ({ accounts: [...s.accounts, newAccount] }));
    const uid_ = get().userId;
    if (uid_) {
      supabase.from('accounts').insert({
        id, user_id: uid_, name: account.name, balance: account.balance,
        account_type: account.accountType, color: account.color,
      }).then(({ error }) => { if (error) toast.error('Failed to save account'); });
    }
  },

  updateAccount: (id, updates) => {
    set((s) => ({
      accounts: s.accounts.map((a) => a.id === id ? { ...a, ...updates } : a),
    }));
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.accountType !== undefined) dbUpdates.account_type = updates.accountType;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    supabase.from('accounts').update(dbUpdates).eq('id', id)
      .then(({ error }) => { if (error) toast.error('Failed to update account'); });
  },

  removeAccount: (id) => {
    set((s) => ({
      accounts: s.accounts.filter((a) => a.id !== id),
      transactions: s.transactions.filter((t) => t.accountId !== id),
    }));
    supabase.from('accounts').delete().eq('id', id)
      .then(({ error }) => { if (error) toast.error('Failed to remove account'); });
  },

  /* ── Transactions ── */
  addTransaction: (transaction) => {
    const id = uid();
    const newTx: Transaction = { ...transaction, id };
    set((s) => {
      const newTxs = [newTx, ...s.transactions];
      let newCards = s.creditCards;
      let newAccounts = s.accounts;

      if (transaction.cardId) {
        newCards = s.creditCards.map((c) => {
          if (c.id !== transaction.cardId) return c;
          const delta = transaction.type === 'expense' ? transaction.amount : -transaction.amount;
          return { ...c, balance: Math.max(0, c.balance + delta) };
        });
      }
      if (transaction.accountId) {
        newAccounts = s.accounts.map((a) => {
          if (a.id !== transaction.accountId) return a;
          const delta = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
          return { ...a, balance: Math.max(0, a.balance + delta) };
        });
      }
      return { transactions: newTxs, creditCards: newCards, accounts: newAccounts };
    });

    const uid_ = get().userId;
    if (uid_) {
      supabase.from('transactions').insert({
        id, user_id: uid_, card_id: transaction.cardId ?? null,
        account_id: transaction.accountId ?? null,
        amount: transaction.amount, description: transaction.description,
        date: transaction.date, category: transaction.category, type: transaction.type,
      }).then(({ error }) => { if (error) toast.error('Failed to save transaction'); });

      if (transaction.cardId) {
        const updatedCard = get().creditCards.find((c) => c.id === transaction.cardId);
        if (updatedCard) {
          supabase.from('credit_cards').update({ balance: updatedCard.balance })
            .eq('id', transaction.cardId)
            .then(({ error }) => { if (error) toast.error('Failed to update card balance'); });
        }
      }
      if (transaction.accountId) {
        const updatedAccount = get().accounts.find((a) => a.id === transaction.accountId);
        if (updatedAccount) {
          supabase.from('accounts').update({ balance: updatedAccount.balance })
            .eq('id', transaction.accountId)
            .then(({ error }) => { if (error) toast.error('Failed to update account balance'); });
        }
      }
    }
  },

  removeTransaction: (id) => {
    const tx = get().transactions.find((t) => t.id === id);
    set((s) => {
      let newCards = s.creditCards;
      let newAccounts = s.accounts;
      if (tx?.cardId) {
        newCards = s.creditCards.map((c) => {
          if (c.id !== tx.cardId) return c;
          const delta = tx.type === 'expense' ? -tx.amount : tx.amount;
          return { ...c, balance: Math.max(0, c.balance + delta) };
        });
      }
      if (tx?.accountId) {
        newAccounts = s.accounts.map((a) => {
          if (a.id !== tx.accountId) return a;
          const delta = tx.type === 'expense' ? tx.amount : -tx.amount;
          return { ...a, balance: Math.max(0, a.balance + delta) };
        });
      }
      return {
        transactions: s.transactions.filter((t) => t.id !== id),
        creditCards: newCards,
        accounts: newAccounts,
      };
    });

    supabase.from('transactions').delete().eq('id', id)
      .then(({ error }) => { if (error) toast.error('Failed to remove transaction'); });

    if (tx?.cardId) {
      const updatedCard = get().creditCards.find((c) => c.id === tx.cardId);
      if (updatedCard) {
        supabase.from('credit_cards').update({ balance: updatedCard.balance })
          .eq('id', tx.cardId)
          .then(({ error }) => { if (error) toast.error('Failed to update card balance'); });
      }
    }
    if (tx?.accountId) {
      const updatedAccount = get().accounts.find((a) => a.id === tx.accountId);
      if (updatedAccount) {
        supabase.from('accounts').update({ balance: updatedAccount.balance })
          .eq('id', tx.accountId)
          .then(({ error }) => { if (error) toast.error('Failed to update account balance'); });
      }
    }
  },

  /* ── Bills ── */
  addBill: (bill) => {
    const id = uid();
    const newBill: Bill = { ...bill, id };
    set((s) => ({ bills: [...s.bills, newBill] }));
    const uid_ = get().userId;
    if (uid_) {
      supabase.from('bills').insert({
        id, user_id: uid_, name: bill.name, amount: bill.amount,
        last_paid_date: bill.lastPaidDate, frequency: bill.frequency, category: bill.category,
      }).then(({ error }) => { if (error) toast.error('Failed to save bill'); });
    }
  },

  removeBill: (id) => {
    set((s) => ({ bills: s.bills.filter((b) => b.id !== id) }));
    supabase.from('bills').delete().eq('id', id)
      .then(({ error }) => { if (error) toast.error('Failed to remove bill'); });
  },

  markBillAsPaid: (id) => {
    const now = new Date().toISOString();
    set((s) => ({
      bills: s.bills.map((b) => b.id === id ? { ...b, lastPaidDate: now } : b),
    }));
    supabase.from('bills').update({ last_paid_date: now }).eq('id', id)
      .then(({ error }) => { if (error) toast.error('Failed to update bill'); });
  },

  /* ── Income ── */
  addIncomeEntry: (entry) => {
    const id = uid();
    const newEntry: IncomeEntry = { ...entry, id };
    set((s) => ({ incomeEntries: [newEntry, ...s.incomeEntries] }));
    const uid_ = get().userId;
    if (uid_) {
      supabase.from('income_entries').insert({
        id, user_id: uid_, amount: entry.amount, description: entry.description,
        date: entry.date, source: entry.source,
      }).then(({ error }) => { if (error) toast.error('Failed to save income entry'); });
    }
  },

  removeIncomeEntry: (id) => {
    set((s) => ({ incomeEntries: s.incomeEntries.filter((e) => e.id !== id) }));
    supabase.from('income_entries').delete().eq('id', id)
      .then(({ error }) => { if (error) toast.error('Failed to remove income entry'); });
  },

  /* ── Utilities ── */
  exportData: () => {
    const s = get();
    const data = {
      creditCards: s.creditCards, accounts: s.accounts,
      transactions: s.transactions, bills: s.bills,
      incomeEntries: s.incomeEntries, exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  clearAllData: async () => {
    const uid_ = get().userId;
    if (uid_) {
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', uid_),
        supabase.from('bills').delete().eq('user_id', uid_),
        supabase.from('income_entries').delete().eq('user_id', uid_),
        supabase.from('credit_cards').delete().eq('user_id', uid_),
        supabase.from('accounts').delete().eq('user_id', uid_),
      ]);
    }
    set({ creditCards: [], accounts: [], transactions: [], bills: [], incomeEntries: [] });
  },
}));
