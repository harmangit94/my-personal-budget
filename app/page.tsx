'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardSummary from '@/components/DashboardSummary';
import CreditCardWidget from '@/components/CreditCardWidget';
import BillCard from '@/components/BillCard';
import IncomeSummary from '@/components/IncomeSummary';
import TransactionsList from '@/components/TransactionsList';
import SettingsPanel from '@/components/Settings';
import type { ActiveSection } from '@/types';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [active, setActive] = useState<ActiveSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function renderSection() {
    switch (active) {
      case 'dashboard':    return <DashboardSummary onNavigate={setActive} />;
      case 'credit-cards': return <CreditCardWidget />;
      case 'bills':        return <BillCard />;
      case 'income':       return <IncomeSummary />;
      case 'transactions': return <TransactionsList />;
      case 'settings':     return <SettingsPanel />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-30 h-full transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <Sidebar
          activeSection={active}
          onNavigate={(s) => { setActive(s); setSidebarOpen(false); }}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-semibold text-sm">Personal Budget</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="fade-in">{renderSection()}</div>
        </main>
      </div>
    </div>
  );
}
