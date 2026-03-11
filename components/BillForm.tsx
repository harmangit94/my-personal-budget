'use client';

import { useState } from 'react';
import { useBudgetStore } from '@/lib/store';
import { CATEGORIES, BILL_FREQUENCIES } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Bill, BillFrequency, TransactionCategory } from '@/types';

type LinkType = 'none' | 'credit-card' | 'account';

interface Props {
  bill?: Bill;
  onSuccess?: () => void;
}

export default function BillForm({ bill, onSuccess }: Props) {
  const { addBill, updateBill, creditCards, accounts } = useBudgetStore();
  const [name, setName]         = useState(bill?.name ?? '');
  const [amount, setAmount]     = useState(bill ? String(bill.amount) : '');
  const [lastPaid, setLastPaid] = useState(
    bill ? bill.lastPaidDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [frequency, setFreq]    = useState<BillFrequency>(bill?.frequency ?? 'monthly');
  const [category, setCategory] = useState<TransactionCategory>(bill?.category ?? 'Utilities');

  const initialLinkType: LinkType = bill?.cardId ? 'credit-card' : bill?.accountId ? 'account' : 'none';
  const [linkType, setLinkType]   = useState<LinkType>(initialLinkType);
  const [cardId, setCardId]       = useState(bill?.cardId ?? '');
  const [accountId, setAccountId] = useState(bill?.accountId ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name || isNaN(amt) || amt <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    const payload = {
      name, amount: amt,
      lastPaidDate: new Date(lastPaid).toISOString(),
      frequency, category,
      cardId: linkType === 'credit-card' && cardId ? cardId : undefined,
      accountId: linkType === 'account' && accountId ? accountId : undefined,
    };
    if (bill) {
      updateBill(bill.id, payload);
      toast.success('Bill updated!');
    } else {
      addBill(payload);
      toast.success('Bill added!');
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Bill Name *</Label>
        <Input placeholder="e.g. Netflix, Electricity" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Amount (AUD) *</Label>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Last Paid Date</Label>
          <Input type="date" value={lastPaid} onChange={(e) => setLastPaid(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <Select value={frequency} onValueChange={(v) => setFreq(v as BillFrequency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BILL_FREQUENCIES.map((f) => (
                <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      {/* Account type */}
      <div className="space-y-1.5">
        <Label>Charge to Account (optional)</Label>
        <Select value={linkType} onValueChange={(v) => { setLinkType(v as LinkType); setCardId(''); setAccountId(''); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No account linked</SelectItem>
            {creditCards.length > 0 && <SelectItem value="credit-card">Credit Card</SelectItem>}
            {accounts.length > 0 && <SelectItem value="account">Debit Account</SelectItem>}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">When marked as paid, an expense will be added to the linked account.</p>
      </div>

      {linkType === 'credit-card' && creditCards.length > 0 && (
        <div className="space-y-1.5">
          <Label>Select Credit Card</Label>
          <Select value={cardId} onValueChange={setCardId}>
            <SelectTrigger><SelectValue placeholder="Choose a card" /></SelectTrigger>
            <SelectContent>
              {creditCards.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {linkType === 'account' && accounts.length > 0 && (
        <div className="space-y-1.5">
          <Label>Select Account</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger><SelectValue placeholder="Choose an account" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full">{bill ? 'Save Changes' : 'Add Bill'}</Button>
    </form>
  );
}
