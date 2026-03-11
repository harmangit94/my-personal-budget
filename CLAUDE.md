# My Personal Budget — Web App

## Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand (`lib/store.ts`)
- **Backend:** Supabase (auth + Postgres)
- **Auth middleware:** `proxy.ts` (exports `proxy` function — Next.js 16 convention, NOT `middleware`)
- **Currency:** AUD

## Key Files
- `types/index.ts` — all shared types
- `lib/store.ts` — Zustand store with all CRUD + Supabase sync
- `lib/utils.ts` — formatCurrency, getNextDueDate, getCardGradient, CATEGORIES, CARD_COLORS
- `lib/supabase.ts` — browser Supabase client
- `app/page.tsx` — root page, renders active section
- `proxy.ts` — auth middleware (must export `proxy`, not `middleware`)

## Navigation Sections
`dashboard` | `credit-cards` | `accounts` | `bills` | `income` | `expenses` | `settings`

Note: "Transactions" is called **Expenses** throughout the UI.

## Supabase Tables
- `credit_cards` (id, user_id, name, balance, credit_limit, color, last_four)
- `accounts` (id, user_id, name, balance, account_type, color)
- `transactions` (id, user_id, card_id, account_id, amount, description, date, category, type)
- `bills` (id, user_id, name, amount, last_paid_date, frequency, category)
- `income_entries` (id, user_id, amount, description, date, source)

## Conventions
- Components are client-side (`'use client'`)
- shadcn/ui components live in `components/ui/`
- All monetary values in AUD, formatted with `formatCurrency()`
- Credit card balance = `limit - availableCredit` (user inputs available credit, not balance)
- % shown on cards = **remaining**, not used
- Transactions linked to either a `cardId` OR `accountId`, never both
- When a transaction is added/removed, linked card or account balance auto-updates

## Commands
```bash
npm run dev      # start dev server
npm run build    # production build
npm run lint     # lint
```

## Deployment
- Hosted on **Vercel**: https://my-personal-budget.vercel.app
- Push to `main` on GitHub → auto-deploys
