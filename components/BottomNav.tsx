'use client';

import { LayoutDashboard, CreditCard, CalendarDays, TrendingUp, List, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveSection } from '@/types';

interface Props {
  activeSection: ActiveSection;
  onNavigate: (s: ActiveSection) => void;
}

const NAV = [
  { id: 'dashboard'    as ActiveSection, label: 'Home',       icon: LayoutDashboard },
  { id: 'credit-cards' as ActiveSection, label: 'Cards',      icon: CreditCard },
  { id: 'bills'        as ActiveSection, label: 'Bills',       icon: CalendarDays },
  { id: 'income'       as ActiveSection, label: 'Income',      icon: TrendingUp },
  { id: 'transactions' as ActiveSection, label: 'Transactions',icon: List },
  { id: 'settings'     as ActiveSection, label: 'Settings',    icon: Settings },
];

export default function BottomNav({ activeSection, onNavigate }: Props) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-stretch">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors text-[10px] font-medium',
              activeSection === id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className={cn('w-5 h-5', activeSection === id && 'stroke-[2.5]')} />
            <span className="leading-none hidden xs:block sm:block">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
