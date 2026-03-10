'use client';

import { useBudgetStore } from '@/lib/store';
import { formatCurrency, getNextDueDate, isThisWeekEntry, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SpendingPieChart from './SpendingPieChart';
import { CreditCard, TrendingUp, CalendarDays, ArrowUpDown, AlertCircle, Plus } from 'lucide-react';
import type { ActiveSection } from '@/types';
import { isSameMonth, parseISO } from 'date-fns';

export default function DashboardSummary({ onNavigate }: { onNavigate: (s: ActiveSection) => void }) {
  const { creditCards, transactions, bills, incomeEntries } = useBudgetStore();
  const now = new Date();

  const totalDebt = creditCards.reduce((s, c) => s + c.balance, 0);

  const thisWeekIncome = incomeEntries
    .filter((e) => isThisWeekEntry(e.date))
    .reduce((s, e) => s + e.amount, 0);

  const billsDueMonth = bills.filter((b) => isSameMonth(getNextDueDate(b), now));
  const billsDueTotal = billsDueMonth.reduce((s, b) => s + b.amount, 0);

  const thisMonthExpenses = transactions
    .filter((t) => t.type === 'expense' && isSameMonth(parseISO(t.date), now))
    .reduce((s, t) => s + t.amount, 0);
  const thisMonthIncome = incomeEntries
    .filter((e) => isSameMonth(parseISO(e.date), now))
    .reduce((s, e) => s + e.amount, 0);
  const cashFlow = thisMonthIncome - thisMonthExpenses;

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const summaryCards = [
    {
      label: 'Total Debt',
      value: formatCurrency(totalDebt),
      sub: `${creditCards.length} card${creditCards.length !== 1 ? 's' : ''}`,
      icon: CreditCard,
      iconCls: 'text-rose-500',
      bgCls: 'bg-rose-50 dark:bg-rose-950/30',
    },
    {
      label: 'This Week Income',
      value: formatCurrency(thisWeekIncome),
      sub: `${incomeEntries.filter((e) => isThisWeekEntry(e.date)).length} entries`,
      icon: TrendingUp,
      iconCls: 'text-emerald-500',
      bgCls: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: 'Bills Due This Month',
      value: String(billsDueMonth.length),
      sub: formatCurrency(billsDueTotal),
      icon: CalendarDays,
      iconCls: 'text-orange-500',
      bgCls: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: 'Monthly Cash Flow',
      value: formatCurrency(Math.abs(cashFlow)),
      sub: cashFlow >= 0 ? 'Positive this month' : 'Negative this month',
      icon: ArrowUpDown,
      iconCls: cashFlow >= 0 ? 'text-blue-500' : 'text-rose-500',
      bgCls: cashFlow >= 0 ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-rose-50 dark:bg-rose-950/30',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Your financial overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">{c.label}</p>
                  <p className="text-2xl font-bold mt-1 leading-none">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{c.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl shrink-0 ${c.bgCls}`}>
                  <c.icon className={`w-5 h-5 ${c.iconCls}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts + transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingPieChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('transactions')}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <AlertCircle className="w-8 h-8 opacity-25" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recent.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${t.type === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{t.category} · {formatDate(t.date)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${t.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {t.type === 'expense' ? '−' : '+'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {([
              ['Add Credit Card', 'credit-cards'],
              ['Add Transaction', 'transactions'],
              ['Add Bill',        'bills'],
              ['Add Income',      'income'],
            ] as [string, ActiveSection][]).map(([label, section]) => (
              <Button key={label} variant="outline" size="sm" onClick={() => onNavigate(section)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
