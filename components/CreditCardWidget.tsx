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
import { Plus, Trash2, CreditCard as CardIcon, ArrowUpCircle, ArrowDownCircle, Pencil, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { CreditCard, CardColor } from '@/types';

/* ── Circular progress ring ── */
function Ring({ pct, size = 76, sw = 7 }: { pct: number; size?: number; sw?: number }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const remaining = Math.min(pct, 100);
  const offset = circ - (remaining / 100) * circ;
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

/* ── Edit card form ── */
function EditCardForm({ card, onSuccess }: { card: CreditCard; onSuccess: () => void }) {
  const { updateCreditCard } = useBudgetStore();
  const [name, setName]             = useState(card.name);
  const [availableCredit, setAvail] = useState(String(Math.max(0, card.limit - card.balance)));
  const [limit, setLimit]           = useState(String(card.limit));
  const [color, setColor]           = useState<CardColor>(card.color);
  const [lastFour, setLast4]        = useState(card.lastFour ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lim = parseFloat(limit);
    const avail = parseFloat(availableCredit);
    if (!name || isNaN(lim) || lim <= 0) { toast.error('Name and limit are required'); return; }
    if (isNaN(avail) || avail < 0) { toast.error('Available credit must be a valid number'); return; }
    const balance = Math.max(0, lim - avail);
    updateCreditCard(card.id, { name, balance, limit: lim, color, lastFour: lastFour || undefined });
    toast.success('Card updated!');
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Card Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Credit Limit *</Label>
          <Input type="number" min="0" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Available Credit</Label>
          <Input type="number" min="0" step="0.01" value={availableCredit} onChange={(e) => setAvail(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Balance owed = Limit − Available credit
        {!isNaN(parseFloat(limit)) && !isNaN(parseFloat(availableCredit)) && (
          <span className="font-semibold text-foreground">
            {' '}= {formatCurrency(Math.max(0, parseFloat(limit) - parseFloat(availableCredit)))}
          </span>
        )}
      </p>
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
      <Button type="submit" className="w-full">Save Changes</Button>
    </form>
  );
}

/* ── Delete confirmation dialog ── */
function DeleteCardDialog({ card, onDeleted }: { card: CreditCard; onDeleted: () => void }) {
  const { removeCreditCard } = useBudgetStore();
  const [open, setOpen] = useState(false);

  function handleDelete() {
    removeCreditCard(card.id);
    toast.success(`${card.name} deleted`);
    setOpen(false);
    onDeleted();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm" variant="outline"
          className="text-rose-500 hover:text-rose-600 hover:border-rose-300 gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
            Delete Credit Card
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{card.name}</span>?
            This will also remove all associated transactions. This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>
              Yes, Delete Card
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Individual card display ── */
function CardDisplay({ card }: { card: CreditCard }) {
  const { transactions } = useBudgetStore();
  const [editOpen, setEditOpen] = useState(false);

  const available = Math.max(0, card.limit - card.balance);
  const remainingPct = card.limit > 0 ? Math.min((available / card.limit) * 100, 100) : 0;

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
              {/* Ring showing % remaining */}
              <div className="relative flex items-center justify-center">
                <Ring pct={remainingPct} />
                <div className="absolute flex flex-col items-center">
                  <span className="text-xs font-bold leading-none">{Math.round(remainingPct)}%</span>
                  <span className="text-[9px] text-white/60 mt-0.5">left</span>
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
                <p className="text-white/60 text-[10px]">Used</p>
                <p className="text-sm font-semibold">
                  {card.limit > 0 ? ((card.balance / card.limit) * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex-1 gap-1.5">
                <Pencil className="w-3.5 h-3.5" />Edit Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Card — {card.name}</DialogTitle></DialogHeader>
              <EditCardForm card={card} onSuccess={() => setEditOpen(false)} />
            </DialogContent>
          </Dialog>
          <DeleteCardDialog card={card} onDeleted={() => {}} />
        </div>

        {/* Recent txns */}
        {recent.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Recent Expenses</p>
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
  const [name, setName]             = useState('');
  const [availableCredit, setAvail] = useState('');
  const [limit, setLimit]           = useState('');
  const [color, setColor]           = useState<CardColor>('blue');
  const [lastFour, setLast4]        = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lim = parseFloat(limit);
    const avail = parseFloat(availableCredit);
    if (!name || isNaN(lim) || lim <= 0) { toast.error('Name and limit are required'); return; }
    if (isNaN(avail) || avail < 0) { toast.error('Available credit must be a valid number'); return; }
    const balance = Math.max(0, lim - avail);
    addCreditCard({ name, balance, limit: lim, color, lastFour: lastFour || undefined });
    toast.success('Credit card added!');
    onSuccess();
  }

  const lim = parseFloat(limit);
  const avail = parseFloat(availableCredit);
  const computedBalance = !isNaN(lim) && !isNaN(avail) ? Math.max(0, lim - avail) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Card Name *</Label>
        <Input placeholder="e.g. ANZ Visa" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Credit Limit *</Label>
          <Input type="number" min="0" step="0.01" placeholder="5000" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Available Credit *</Label>
          <Input type="number" min="0" step="0.01" placeholder="3200" value={availableCredit} onChange={(e) => setAvail(e.target.value)} />
        </div>
      </div>
      {computedBalance !== null && (
        <p className="text-xs text-muted-foreground">
          Balance owed: <span className="font-semibold text-foreground">{formatCurrency(computedBalance)}</span>
        </p>
      )}
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

  const totalBalance = creditCards.reduce((s, c) => s + c.balance, 0);
  const totalAvailable = creditCards.reduce((s, c) => s + Math.max(0, c.limit - c.balance), 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Credit Cards</h2>
          {creditCards.length > 0 && (
            <p className="text-muted-foreground text-sm mt-0.5">
              Total owed: <span className="font-semibold text-rose-500">{formatCurrency(totalBalance)}</span>
              {' · '}Available: <span className="font-semibold text-emerald-600">{formatCurrency(totalAvailable)}</span>
            </p>
          )}
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
