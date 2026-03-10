'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, CreditCard, CalendarDays, TrendingUp,
  List, Settings, Sun, Moon, Wallet,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { ActiveSection } from '@/types';

interface Props {
  activeSection: ActiveSection;
  onNavigate: (s: ActiveSection) => void;
}

const NAV = [
  { id: 'dashboard'    as ActiveSection, label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'credit-cards' as ActiveSection, label: 'Credit Cards',   icon: CreditCard },
  { id: 'bills'        as ActiveSection, label: 'Upcoming Bills', icon: CalendarDays },
  { id: 'income'       as ActiveSection, label: 'Income',         icon: TrendingUp },
  { id: 'transactions' as ActiveSection, label: 'Transactions',   icon: List },
  { id: 'settings'     as ActiveSection, label: 'Settings',       icon: Settings },
];

export default function Sidebar({ activeSection, onNavigate }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === 'dark';

  return (
    <div className="w-64 h-full flex flex-col bg-card border-r border-border">
      {/* Brand */}
      <div className="p-5 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Wallet className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="leading-none">
          <p className="font-bold text-sm">Budget</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Personal Finance · AUD</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
          Menu
        </p>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              activeSection === id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {mounted ? (isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />) : <Sun className="w-4 h-4" />}
            <span>{mounted ? (isDark ? 'Dark' : 'Light') : 'Light'} Mode</span>
          </div>
          {mounted && (
            <Switch
              checked={isDark}
              onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
