'use client';

import { useState } from 'react';
import { useBudgetStore } from '@/lib/store';
import { formatCurrency, formatDate, isThisWeekEntry } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { startOfWeek, endOfWeek, format } from 'date-fns';

function AddIncomeForm({ onSuccess }: { onSuccess: () => void }) {
  const { addIncomeEntry } = useBudgetStore();
  const [amount, setAmount] = useState('');
  const [desc, setDesc]     = useState('');
  const [source, setSource] = useState('');
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!desc || isNaN(amt) || amt <= 0) { toast.error('Please fill in all fields'); return; }
    addIncomeEntry({ amount: amt, description: desc, source, date: new Date(date).toISOString() });
    toast.success('Income entry added!');
    setAmount(''); setDesc(''); setSource('');
    setDate(new Date().toISOString().split('T')[0]);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Description *</Label>
        <Input placeholder="e.g. Weekly salary" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Amount (AUD) *</Label>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Source (optional)</Label>
        <Input placeholder="e.g. Employer, Freelance" value={source} onChange={(e) => setSource(e.target.value)} />
      </div>
      <Button type="submit" className="w-full">Add Income</Button>
    </form>
  );
}

export default function IncomeSummary() {
  const { incomeEntries, removeIncomeEntry } = useBudgetStore();
  const [open, setOpen] = useState(false);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(now, { weekStartsOn: 1 });

  const thisWeek = incomeEntries.filter((e) => isThisWeekEntry(e.date));
  const thisWeekTotal = thisWeek.reduce((s, e) => s + e.amount, 0);
  const allTimeTotal  = incomeEntries.reduce((s, e) => s + e.amount, 0);

  const sorted = [...incomeEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Income</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Income</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Income Entry</DialogTitle></DialogHeader>
            <AddIncomeForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">{formatCurrency(thisWeekTotal)}</p>
              <p className="text-xs text-muted-foreground">{thisWeek.length} entries</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">All Time Total</p>
              <p className="text-2xl font-bold">{formatCurrency(allTimeTotal)}</p>
              <p className="text-xs text-muted-foreground">{incomeEntries.length} entries total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">All Income Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
              <DollarSign className="w-10 h-10 opacity-20" />
              <p className="text-sm">No income recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sorted.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{entry.description}</p>
                      {isThisWeekEntry(entry.date) && (
                        <Badge variant="secondary" className="text-[10px] h-4 shrink-0">
                          This week
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.source ? `${entry.source} · ` : ''}{formatDate(entry.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-emerald-500">
                      +{formatCurrency(entry.amount)}
                    </span>
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                      onClick={() => { removeIncomeEntry(entry.id); toast.success('Entry removed'); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
