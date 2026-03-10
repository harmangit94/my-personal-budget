'use client';

import { useState } from 'react';
import { useBudgetStore } from '@/lib/store';
import { CATEGORIES, BILL_FREQUENCIES } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { BillFrequency, TransactionCategory } from '@/types';

export default function BillForm({ onSuccess }: { onSuccess?: () => void }) {
  const { addBill } = useBudgetStore();
  const [name, setName]         = useState('');
  const [amount, setAmount]     = useState('');
  const [lastPaid, setLastPaid] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFreq]    = useState<BillFrequency>('monthly');
  const [category, setCategory] = useState<TransactionCategory>('Utilities');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name || isNaN(amt) || amt <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    addBill({
      name,
      amount: amt,
      lastPaidDate: new Date(lastPaid).toISOString(),
      frequency,
      category,
    });
    toast.success('Bill added!');
    setName('');
    setAmount('');
    setLastPaid(new Date().toISOString().split('T')[0]);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Bill Name *</Label>
        <Input
          placeholder="e.g. Netflix, Electricity"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
                <SelectItem key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </SelectItem>
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

      <Button type="submit" className="w-full">Add Bill</Button>
    </form>
  );
}
