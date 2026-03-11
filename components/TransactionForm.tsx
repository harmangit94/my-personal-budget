'use client';

import { useState } from 'react';
import { useBudgetStore } from '@/lib/store';
import { CATEGORIES } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { TransactionCategory } from '@/types';

interface Props {
  onSuccess?: () => void;
}

type AccountLinkType = 'none' | 'credit-card' | 'account';

export default function TransactionForm({ onSuccess }: Props) {
  const { addTransaction, creditCards, accounts } = useBudgetStore();
  const [amount, setAmount]           = useState('');
  const [description, setDesc]        = useState('');
  const [date, setDate]               = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory]       = useState<TransactionCategory>('Other');
  const [type, setType]               = useState<'expense' | 'deposit'>('expense');
  const [accountLinkType, setLinkType] = useState<AccountLinkType>('none');
  const [selectedCardId, setCardId]   = useState('');
  const [selectedAccountId, setAccId] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description || isNaN(amt) || amt <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    addTransaction({
      amount: amt,
      description,
      date: new Date(date).toISOString(),
      category,
      type,
      cardId: accountLinkType === 'credit-card' && selectedCardId ? selectedCardId : undefined,
      accountId: accountLinkType === 'account' && selectedAccountId ? selectedAccountId : undefined,
    });
    toast.success(`${type === 'expense' ? 'Expense' : 'Deposit'} added!`);
    setAmount('');
    setDesc('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Other');
    setLinkType('none');
    setCardId('');
    setAccId('');
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={type === 'expense' ? 'default' : 'outline'}
          onClick={() => setType('expense')}
          className="w-full"
        >
          Expense
        </Button>
        <Button
          type="button"
          variant={type === 'deposit' ? 'default' : 'outline'}
          onClick={() => setType('deposit')}
          className="w-full"
        >
          Deposit / Payment
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>Description *</Label>
        <Input
          placeholder="e.g. Woolworths grocery run"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Amount (AUD) *</Label>
          <Input
            type="number" min="0" step="0.01" placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as TransactionCategory)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Account type selector */}
      <div className="space-y-1.5">
        <Label>Account Type</Label>
        <Select value={accountLinkType} onValueChange={(v) => {
          setLinkType(v as AccountLinkType);
          setCardId('');
          setAccId('');
        }}>
          <SelectTrigger><SelectValue placeholder="No account linked" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No account linked</SelectItem>
            {creditCards.length > 0 && <SelectItem value="credit-card">Credit Card</SelectItem>}
            {accounts.length > 0 && <SelectItem value="account">Debit Account</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {accountLinkType === 'credit-card' && creditCards.length > 0 && (
        <div className="space-y-1.5">
          <Label>Select Credit Card</Label>
          <Select value={selectedCardId} onValueChange={setCardId}>
            <SelectTrigger><SelectValue placeholder="Choose a card" /></SelectTrigger>
            <SelectContent>
              {creditCards.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {accountLinkType === 'account' && accounts.length > 0 && (
        <div className="space-y-1.5">
          <Label>Select Account</Label>
          <Select value={selectedAccountId} onValueChange={setAccId}>
            <SelectTrigger><SelectValue placeholder="Choose an account" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full">
        Add {type === 'expense' ? 'Expense' : 'Deposit'}
      </Button>
    </form>
  );
}
