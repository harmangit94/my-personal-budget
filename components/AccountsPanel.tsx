'use client';

import { useState } from 'react';
import { useBudgetStore } from '@/lib/store';
import { formatCurrency, getCardGradient, CARD_COLORS, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Pencil, AlertTriangle, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Account, AccountType, CardColor } from '@/types';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'cash', label: 'Cash' },
];

/* ── Delete confirmation ── */
function DeleteAccountDialog({ account }: { account: Account }) {
  const { removeAccount } = useBudgetStore();
  const [open, setOpen] = useState(false);

  function handleDelete() {
    removeAccount(account.id);
    toast.success(`${account.name} deleted`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-rose-500 hover:text-rose-600 hover:border-rose-300 gap-1.5">
          <Trash2 className="w-3.5 h-3.5" />Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="w-5 h-5" />Delete Account
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{account.name}</span>?
            This will also unlink associated transactions. This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Yes, Delete</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Account form (add/edit) ── */
function AccountForm({ account, onSuccess }: { account?: Account; onSuccess: () => void }) {
  const { addAccount, updateAccount } = useBudgetStore();
  const [name, setName]               = useState(account?.name ?? '');
  const [balance, setBalance]         = useState(account ? String(account.balance) : '');
  const [accountType, setAccountType] = useState<AccountType>(account?.accountType ?? 'checking');
  const [color, setColor]             = useState<CardColor>(account?.color ?? 'blue');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const bal = parseFloat(balance);
    if (!name) { toast.error('Account name is required'); return; }
    if (isNaN(bal) || bal < 0) { toast.error('Balance must be a valid number'); return; }

    if (account) {
      updateAccount(account.id, { name, balance: bal, accountType, color });
      toast.success('Account updated!');
    } else {
      addAccount({ name, balance: bal, accountType, color });
      toast.success('Account added!');
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Account Name *</Label>
        <Input placeholder="e.g. Everyday Account" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Current Balance (AUD)</Label>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Account Type</Label>
          <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {CARD_COLORS.map((c) => (
            <button
              key={c} type="button" onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${getCardGradient(c)} border-2 transition-all
                ${color === c ? 'border-primary scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
            />
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full">{account ? 'Save Changes' : 'Add Account'}</Button>
    </form>
  );
}

/* ── Individual account card ── */
function AccountCard({ account }: { account: Account }) {
  const { transactions } = useBudgetStore();
  const [editOpen, setEditOpen] = useState(false);

  const recent = transactions
    .filter((t) => t.accountId === account.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const accountTypeLabel = ACCOUNT_TYPES.find((t) => t.value === account.accountType)?.label ?? account.accountType;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Visual card */}
        <div
          className={`relative rounded-2xl p-5 bg-gradient-to-br ${getCardGradient(account.color)} text-white shadow-xl overflow-hidden`}
          style={{ minHeight: '140px' }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-widest">{accountTypeLabel} Account</p>
                <h3 className="text-base font-bold mt-0.5 max-w-[200px] truncate">{account.name}</h3>
              </div>
              <Wallet className="w-6 h-6 text-white/60" />
            </div>
            <div>
              <p className="text-white/60 text-[10px]">Balance</p>
              <p className="text-2xl font-bold leading-none mt-0.5">{formatCurrency(account.balance)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex-1 gap-1.5">
                <Pencil className="w-3.5 h-3.5" />Edit Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Account — {account.name}</DialogTitle></DialogHeader>
              <AccountForm account={account} onSuccess={() => setEditOpen(false)} />
            </DialogContent>
          </Dialog>
          <DeleteAccountDialog account={account} />
        </div>

        {/* Recent transactions */}
        {recent.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Recent Transactions</p>
              <div className="space-y-1.5">
                {recent.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {t.type === 'expense'
                        ? <ArrowUpCircle className="w-3 h-3 text-rose-500 shrink-0" />
                        : <ArrowDownCircle className="w-3 h-3 text-emerald-500 shrink-0" />}
                      <span className="truncate text-muted-foreground">{t.description}</span>
                      <span className="text-muted-foreground/60 shrink-0">· {formatDate(t.date)}</span>
                    </div>
                    <span className={`font-semibold shrink-0 ml-2 ${t.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {t.type === 'expense' ? '−' : '+'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Main ── */
export default function AccountsPanel() {
  const { accounts } = useBudgetStore();
  const [open, setOpen] = useState(false);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Accounts</h2>
          {accounts.length > 0 && (
            <p className="text-muted-foreground text-sm mt-0.5">
              Total balance: <span className="font-semibold text-emerald-600">{formatCurrency(totalBalance)}</span>
            </p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Debit Account</DialogTitle></DialogHeader>
            <AccountForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-20 flex flex-col items-center text-muted-foreground gap-3">
            <Wallet className="w-12 h-12 opacity-20" />
            <p className="font-medium">No accounts yet</p>
            <p className="text-sm">Add your bank or cash accounts to track balances</p>
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {accounts.map((account) => <AccountCard key={account.id} account={account} />)}
        </div>
      )}
    </div>
  );
}
