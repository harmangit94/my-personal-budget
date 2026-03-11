'use client';

import { useBudgetStore } from '@/lib/store';
import { formatCurrency, getNextDueDate, isThisWeekEntry, formatDate, getCardGradient, getDaysUntilDue } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SpendingPieChart from './SpendingPieChart';
import { CreditCard, TrendingUp, CalendarDays, ArrowUpDown, AlertCircle, Plus, Wallet } from 'lucide-react';
import type { ActiveSection } from '@/types';
import { isSameMonth, parseISO, isThisWeek } from 'date-fns';
import { format } from 'date-fns';

export default function DashboardSummary({ onNavigate }: { onNavigate: (s: ActiveSection) => void }) {
  const { creditCards, accounts, transactions, bills, incomeEntries } = useBudgetStore();
  const now = new Date();

  const totalDebt = creditCards.reduce((s, c) => s + c.balance, 0);
  const totalAvailable = creditCards.reduce((s, c) => s + Math.max(0, c.limit - c.balance), 0);

  const thisWeekIncome = incomeEntries
    .filter((e) => isThisWeekEntry(e.date))
    .reduce((s, e) => s + e.amount, 0);

  const billsDueThisWeek = bills.filter((b) => isThisWeek(getNextDueDate(b), { weekStartsOn: 1 }));
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
      label: 'Bills This Month',
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

      {/* Bills due this week */}
      {billsDueThisWeek.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-orange-600">Bills Due This Week</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{billsDueThisWeek.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('bills')}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {billsDueThisWeek.map((bill) => {
                const days = getDaysUntilDue(bill);
                return (
                  <div key={bill.id} className="flex items-center justify-between py-2 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {format(getNextDueDate(bill), 'EEE, MMM d')}
                        {days <= 0 ? ' · Overdue' : days <= 3 ? ` · ${days}d left` : ''}
                      </p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${days <= 3 ? 'text-rose-500' : ''}`}>
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit cards summary */}
      {creditCards.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Credit Cards</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('credit-cards')}>
              Manage
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total owed</p>
                <p className="font-bold text-rose-500">{formatCurrency(totalDebt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total available</p>
                <p className="font-bold text-emerald-600">{formatCurrency(totalAvailable)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {creditCards.map((card) => {
                const available = Math.max(0, card.limit - card.balance);
                const remainingPct = card.limit > 0 ? (available / card.limit) * 100 : 0;
                return (
                  <div key={card.id} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${getCardGradient(card.color)} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium truncate">{card.name}</span>
                        <span className="text-muted-foreground shrink-0 ml-2">{Math.round(remainingPct)}% left</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${remainingPct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-rose-500 shrink-0">{formatCurrency(card.balance)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounts summary */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Accounts</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('accounts')}>
              Manage
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${getCardGradient(account.color)} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{account.accountType}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 shrink-0">{formatCurrency(account.balance)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardTitle className="text-sm font-semibold">Recent Expenses</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('expenses')}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <AlertCircle className="w-8 h-8 opacity-25" />
                <p className="text-sm">No expenses yet</p>
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
              ['Add Account',     'accounts'],
              ['Add Expense',     'expenses'],
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
