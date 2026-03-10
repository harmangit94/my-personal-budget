'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useBudgetStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Download, Trash2, Sun, Moon, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const { exportData, clearAllData, creditCards, transactions, bills, incomeEntries } = useBudgetStore();
  const [mounted, setMounted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === 'dark';

  function handleClear() {
    clearAllData();
    setConfirmOpen(false);
    toast.success('All data cleared');
  }

  const stats = [
    { label: 'Credit Cards',   count: creditCards.length },
    { label: 'Transactions',   count: transactions.length },
    { label: 'Bills',          count: bills.length },
    { label: 'Income Entries', count: incomeEntries.length },
  ];

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Preferences and data management</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Appearance</CardTitle>
          <CardDescription className="text-xs">Customize the look of the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mounted ? (isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />) : <Sun className="w-4 h-4" />}
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
              </div>
            </div>
            {mounted && (
              <Switch
                checked={isDark}
                onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Data Summary</CardTitle>
          <CardDescription className="text-xs">Overview of your stored data (saved in localStorage)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Export Data</CardTitle>
          <CardDescription className="text-xs">
            Download all your budget data as a JSON file for backup or migration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => { exportData(); toast.success('Export started!'); }}
          >
            <Download className="w-4 h-4 mr-2" />Export as JSON
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-rose-200 dark:border-rose-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-rose-600 dark:text-rose-400">Danger Zone</CardTitle>
          <CardDescription className="text-xs">Irreversible — proceed with caution</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />Clear All Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />Are you absolutely sure?
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This will permanently delete all credit cards, transactions, bills, and income entries.
                This action <strong>cannot be undone</strong>.
              </p>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleClear}>Yes, delete everything</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>All data is stored locally in your browser using localStorage. Nothing is sent to any server.</p>
      </div>
    </div>
  );
}
