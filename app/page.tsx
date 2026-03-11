'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useBudgetStore } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import DashboardSummary from '@/components/DashboardSummary';
import CreditCardWidget from '@/components/CreditCardWidget';
import AccountsPanel from '@/components/AccountsPanel';
import BillCard from '@/components/BillCard';
import IncomeSummary from '@/components/IncomeSummary';
import TransactionsList from '@/components/TransactionsList';
import SettingsPanel from '@/components/Settings';
import type { ActiveSection } from '@/types';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [active, setActive]         = useState<ActiveSection>('dashboard');
  const [sidebarOpen, setSidebar]   = useState(false);
  const { loadFromSupabase, clearLocalState, loading } = useBudgetStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loadFromSupabase(data.session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadFromSupabase(session.user.id);
      } else {
        clearLocalState();
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderSection() {
    switch (active) {
      case 'dashboard':    return <DashboardSummary onNavigate={setActive} />;
      case 'credit-cards': return <CreditCardWidget />;
      case 'accounts':     return <AccountsPanel />;
      case 'bills':        return <BillCard />;
      case 'income':       return <IncomeSummary />;
      case 'expenses':     return <TransactionsList />;
      case 'settings':     return <SettingsPanel />;
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your budget...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex shrink-0">
        <Sidebar activeSection={active} onNavigate={setActive} />
      </aside>

      {/* Mobile slide-in sidebar */}
      <aside
        className={`fixed lg:hidden z-30 h-full transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar
          activeSection={active}
          onNavigate={(s) => { setActive(s); setSidebar(false); }}
        />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setSidebar(!sidebarOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <div className="space-y-1.5">
              <span className="block w-5 h-0.5 bg-foreground" />
              <span className="block w-5 h-0.5 bg-foreground" />
              <span className="block w-4 h-0.5 bg-foreground" />
            </div>
          </button>
          <span className="font-semibold text-sm">Personal Budget</span>
          <div className="w-9" />
        </div>

        {/* Content — extra bottom padding on mobile for BottomNav */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="fade-in">{renderSection()}</div>
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav activeSection={active} onNavigate={setActive} />
    </div>
  );
}
