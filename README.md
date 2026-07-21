# BinaaMart

A bilingual (English / Arabic + RTL) construction materials, delivery and
handyman marketplace. Built with **React + TypeScript + Vite + Tailwind CSS**
on **Supabase** (Postgres, Auth, Storage, RLS, Edge Functions).

> This repository is a production-oriented **foundation**. It implements Stage 1
> (foundation), the signature engines (vehicle matching, material calculators,
> unit conversion), the core commerce surface, the full database schema + RLS,
> and the AI ordering-assistant slice. See **`docs/ROADMAP.md`** for exactly what
> is done vs. planned, and **`docs/`** for the architecture deliverables.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

The app runs immediately using bundled seed data (`src/data/*`). To use a real
backend, copy `.env.example` to `.env` and set:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Once set, the catalogue layer (`src/lib/catalog.ts`) switches from the seed
fallback to Supabase.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | oxlint |

## Database

```bash
# with the Supabase CLI + a linked project
supabase db push                 # applies supabase/migrations/*
psql "$DATABASE_URL" -f supabase/seed.sql   # sample data (testing only)
supabase functions deploy match-vehicle
```

Migrations:
- `0001_core_schema.sql` — ~90 tables, enums, indexes, soft deletes
- `0002_rls_policies.sql` — Row-Level Security + role helper functions

## What to look at first

- **Vehicle-matching engine** — `src/engine/vehicleMatching.ts` +
  `supabase/functions/match-vehicle/index.ts` (`docs/VEHICLE_MATCHING.md`)
- **Material calculators** — `src/engine/calculators.ts`
- **Cart with live logistics** — `/cart`
- **AI ordering assistant** — floating button, `src/ai/matcher.ts`
- **Bilingual + RTL** — toggle the language switcher in the header

## Manual verification checklist

1. Home renders in English; switch language → layout flips to RTL, text
   right-aligned.
2. `/product/porcelain-floor-tile` → variant table with per-row add-to-cart.
3. Add items → `/cart` shows total weight/volume, matched vehicle and warnings.
4. `/calculators/tiles` → enter area 120 → boxes required (rounded up).
5. AI button → "20 bags of cement, 500 blocks, 10 pvc pipes" → draft matches
   with confidence badges; nothing is ordered without explicit confirmation.

## Documentation (`docs/`)

`ARCHITECTURE.md` · `DATABASE_ERD.md` · `ROLES_MATRIX.md` · `PAGE_MAP.md` ·
`WORKFLOWS.md` · `VEHICLE_MATCHING.md` · `INTEGRATIONS.md` · `ROADMAP.md`

## Security highlights

- Prices, tax, delivery fees, order/payment status, vehicle assignment,
  inventory and professional verification are **not** customer-writable (RLS).
- All third-party secrets live only in Supabase Edge Function secrets.
- Orders store an **immutable** delivery-address snapshot.
- The AI assistant has **no** direct DB write access and cannot finalise an
  order without explicit customer confirmation.
