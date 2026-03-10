'use client';

import { useState } from 'react';
import { useBudgetStore } from '@/lib/store';
import { formatCurrency, getNextDueDate, getDaysUntilDue, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BillForm from './BillForm';
import { Plus, Trash2, CheckCircle2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

function urgency(days: number) {
  if (days < 0)  return { badge: 'destructive' as const, bar: 'bg-rose-500',    label: 'Overdue' };
  if (days <= 3) return { badge: 'destructive' as const, bar: 'bg-rose-500',    label: `${days}d left` };
  if (days <= 7) return { badge: 'secondary'   as const, bar: 'bg-orange-400',  label: `${days}d left` };
  return          { badge: 'outline'     as const, bar: 'bg-emerald-500', label: `${days}d left` };
}

export default function BillCard() {
  const { bills, markBillAsPaid, removeBill } = useBudgetStore();
  const [open, setOpen] = useState(false);

  const sorted = [...bills].sort(
    (a, b) => getNextDueDate(a).getTime() - getNextDueDate(b).getTime()
  );

  const estMonthly = bills.reduce((s, b) => {
    const factor: Record<string, number> = {
      weekly: 4.33, 'bi-weekly': 2.17, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12,
    };
    return s + b.amount * (factor[b.frequency] ?? 1);
  }, 0);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Upcoming Bills</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Est. monthly total:{' '}
            <span className="font-semibold text-foreground">{formatCurrency(estMonthly)}</span>
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Bill</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Recurring Bill</DialogTitle></DialogHeader>
            <BillForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {bills.length === 0 ? (
        <Card>
          <CardContent className="py-20 flex flex-col items-center text-muted-foreground gap-3">
            <CalendarDays className="w-12 h-12 opacity-20" />
            <p className="font-medium">No bills added yet</p>
            <p className="text-sm">Track recurring bills to never miss a payment</p>
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Add Bill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((bill) => {
            const nextDue = getNextDueDate(bill);
            const days = getDaysUntilDue(bill);
            const u = urgency(days);

            return (
              <Card
                key={bill.id}
                className={days <= 3 ? 'border-rose-200 dark:border-rose-900' : ''}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Urgency bar */}
                    <div className={`w-1 self-stretch rounded-full ${u.bar} shrink-0`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{bill.name}</p>
                            <Badge variant={u.badge} className="text-[10px] h-5">
                              {u.label}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] h-5 capitalize">
                              {bill.frequency}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {bill.category} · Due {format(nextDue, 'EEE, MMM d yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last paid: {formatDate(bill.lastPaidDate)}
                          </p>
                        </div>
                        <p className="text-base font-bold shrink-0">{formatCurrency(bill.amount)}</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm" variant="outline"
                        className="text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 h-8"
                        onClick={() => { markBillAsPaid(bill.id); toast.success(`${bill.name} marked as paid!`); }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Paid
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="text-muted-foreground hover:text-rose-500 h-8 w-8 p-0"
                        onClick={() => { removeBill(bill.id); toast.success('Bill removed'); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
