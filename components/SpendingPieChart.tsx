'use client';

import { useBudgetStore } from '@/lib/store';
import { CATEGORY_COLORS, formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

export default function SpendingPieChart() {
  const { transactions } = useBudgetStore();
  const expenses = transactions.filter((t) => t.type === 'expense');

  const totals = expenses.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {});

  const data = Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-muted-foreground gap-2">
        <PieIcon className="w-10 h-10 opacity-25" />
        <p className="text-sm">No spending data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={105}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#6b7280'} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
                <p className="font-semibold">{payload[0].name}</p>
                <p className="text-muted-foreground">{formatCurrency(payload[0].value as number)}</p>
              </div>
            ) : null
          }
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span className="text-xs text-foreground">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
