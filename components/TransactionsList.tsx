'use client';

import { useState } from 'react';
import { useBudgetStore } from '@/lib/store';
import { formatCurrency, formatDate, CATEGORIES } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TransactionForm from './TransactionForm';
import CsvImport from './CsvImport';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Receipt, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { TransactionCategory } from '@/types';

export default function TransactionsList() {
  const { transactions, removeTransaction, creditCards, accounts } = useBudgetStore();
  const [open, setOpen]         = useState(false);
  const [csvOpen, setCsvOpen]   = useState(false);
  const [typeFilter, setType]   = useState<'all' | 'expense' | 'deposit'>('all');
  const [catFilter, setCat]     = useState<'all' | TransactionCategory>('all');

  const getLinkedName = (cardId?: string, accountId?: string) => {
    if (cardId) return creditCards.find((c) => c.id === cardId)?.name ?? 'Card';
    if (accountId) return accounts.find((a) => a.id === accountId)?.name ?? 'Account';
    return null;
  };

  const getLinkedType = (cardId?: string, accountId?: string) => {
    if (cardId) return 'Credit Card';
    if (accountId) return 'Account';
    return null;
  };

  const filtered = [...transactions]
    .filter((t) => typeFilter === 'all' || t.type === typeFilter)
    .filter((t) => catFilter  === 'all' || t.category === catFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalExpenses = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalDeposits = filtered.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expenses</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{transactions.length} total</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="w-4 h-4 mr-2" />Import CSV</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Import Expenses from CSV</DialogTitle></DialogHeader>
              <CsvImport onDone={() => setCsvOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
              <TransactionForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters + totals */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={(v) => setType(v as typeof typeFilter)}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
            <SelectItem value="deposit">Deposits</SelectItem>
          </SelectContent>
        </Select>

        <Select value={catFilter} onValueChange={(v) => setCat(v as typeof catFilter)}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-3 text-sm font-semibold">
          <span className="text-rose-500">−{formatCurrency(totalExpenses)}</span>
          <span className="text-emerald-500">+{formatCurrency(totalDeposits)}</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
              <Receipt className="w-10 h-10 opacity-20" />
              <p className="text-sm">No expenses found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((t) => {
                const linkedName = getLinkedName(t.cardId, t.accountId);
                const linkedType = getLinkedType(t.cardId, t.accountId);
                return (
                  <div key={t.id} className="flex items-center gap-4 px-4 py-3">
                    {t.type === 'expense'
                      ? <ArrowUpCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      : <ArrowDownCircle className="w-4 h-4 text-emerald-500 shrink-0" />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <Badge variant="outline" className="text-[10px] h-4">{t.category}</Badge>
                        {linkedName && linkedType && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {linkedType}: {linkedName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(t.date)}</p>
                    </div>

                    <span className={`font-semibold text-sm shrink-0 ${t.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {t.type === 'expense' ? '−' : '+'}{formatCurrency(t.amount)}
                    </span>

                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-500 shrink-0"
                      onClick={() => { removeTransaction(t.id); toast.success('Transaction removed'); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
