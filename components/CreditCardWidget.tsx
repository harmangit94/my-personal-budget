'use client';

import { useState } from 'react';
import { useBudgetStore } from '@/lib/store';
import { formatCurrency, getCardGradient, CARD_COLORS, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import TransactionForm from './TransactionForm';
import { Plus, Trash2, CreditCard as CardIcon, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CreditCard, CardColor } from '@/types';

/* ── Circular progress ring ── */
function Ring({ pct, size = 76, sw = 7 }: { pct: number; size?: number; sw?: number }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={sw} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="white" strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .5s ease' }}
      />
    </svg>
  );
}

/* ── Individual card display ── */
function CardDisplay({ card }: { card: CreditCard }) {
  const { removeCreditCard, transactions } = useBudgetStore();
  const [txOpen, setTxOpen] = useState(false);

  const util = card.limit > 0 ? Math.min((card.balance / card.limit) * 100, 100) : 0;
  const available = Math.max(0, card.limit - card.balance);

  const recent = transactions
    .filter((t) => t.cardId === card.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Visual card */}
        <div
          className={`relative rounded-2xl p-5 bg-gradient-to-br ${getCardGradient(card.color)} text-white shadow-xl overflow-hidden`}
          style={{ minHeight: '190px' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-widest">Credit Card</p>
                <h3 className="text-base font-bold mt-0.5 max-w-[160px] truncate">{card.name}</h3>
                {card.lastFour && (
                  <p className="text-white/60 text-xs mt-0.5">•••• {card.lastFour}</p>
                )}
              </div>
              {/* Ring */}
              <div className="relative flex items-center justify-center">
                <Ring pct={util} />
                <div className="absolute flex flex-col items-center">
                  <span className="text-xs font-bold leading-none">{Math.round(util)}%</span>
                  <span className="text-[9px] text-white/60 mt-0.5">used</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-white/60 text-[10px]">Balance Owed</p>
                <p className="text-lg font-bold leading-none mt-0.5">{formatCurrency(card.balance)}</p>
              </div>
              <div>
                <p className="text-white/60 text-[10px]">Available</p>
                <p className="text-lg font-bold leading-none mt-0.5">{formatCurrency(available)}</p>
              </div>
              <div>
                <p className="text-white/60 text-[10px]">Limit</p>
                <p className="text-sm font-semibold">{formatCurrency(card.limit)}</p>
              </div>
              <div>
                <p className="text-white/60 text-[10px]">Utilization</p>
                <p className="text-sm font-semibold">{util.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Dialog open={txOpen} onOpenChange={setTxOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1">
                <Plus className="w-3.5 h-3.5 mr-1.5" />Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction — {card.name}</DialogTitle>
              </DialogHeader>
              <TransactionForm cardId={card.id} onSuccess={() => setTxOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button
            size="sm" variant="outline"
            className="text-rose-500 hover:text-rose-600 hover:border-rose-300"
            onClick={() => { removeCreditCard(card.id); toast.success('Card removed'); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Recent txns */}
        {recent.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Recent</p>
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

/* ── Add card form ── */
function AddCardForm({ onSuccess }: { onSuccess: () => void }) {
  const { addCreditCard } = useBudgetStore();
  const [name, setName]       = useState('');
  const [balance, setBalance] = useState('');
  const [limit, setLimit]     = useState('');
  const [color, setColor]     = useState<CardColor>('blue');
  const [lastFour, setLast4]  = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lim = parseFloat(limit);
    if (!name || isNaN(lim) || lim <= 0) { toast.error('Name and limit are required'); return; }
    addCreditCard({ name, balance: parseFloat(balance) || 0, limit: lim, color, lastFour: lastFour || undefined });
    toast.success('Credit card added!');
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Card Name *</Label>
        <Input placeholder="e.g. ANZ Visa" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Current Balance</Label>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Credit Limit *</Label>
          <Input type="number" min="0" step="0.01" placeholder="5000" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Last 4 Digits (optional)</Label>
        <Input placeholder="1234" maxLength={4} value={lastFour} onChange={(e) => setLast4(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Card Color</Label>
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
      <Button type="submit" className="w-full">Add Card</Button>
    </form>
  );
}

/* ── Main section ── */
export default function CreditCardWidget() {
  const { creditCards } = useBudgetStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Credit Cards</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Manage balances and transactions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Card</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Credit Card</DialogTitle></DialogHeader>
            <AddCardForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {creditCards.length === 0 ? (
        <Card>
          <CardContent className="py-20 flex flex-col items-center text-muted-foreground gap-3">
            <CardIcon className="w-12 h-12 opacity-20" />
            <p className="font-medium">No credit cards yet</p>
            <p className="text-sm">Add your first card to start tracking</p>
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Add Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {creditCards.map((card) => <CardDisplay key={card.id} card={card} />)}
        </div>
      )}
    </div>
  );
}
