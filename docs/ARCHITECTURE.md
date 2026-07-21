# BinaaMart — Application Architecture

Bilingual (English / Arabic + RTL) construction materials, delivery and handyman
marketplace. This document is deliverable #1 of the spec's "Initial output"
(§44).

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| UI | React 19 + TypeScript + Vite | Modular components, mobile-first |
| Styling | Tailwind CSS v4 | Design tokens in `src/index.css` (`@theme`); logical props for RTL |
| i18n | i18next + react-i18next | `en`/`ar` resources; `<html dir>` synced to language |
| Routing | react-router-dom | See `docs/PAGE_MAP.md` |
| State | React Context + TanStack Query (server data) | Cart in `CartContext`; catalogue via `lib/catalog.ts` |
| Backend | Supabase | Postgres + Auth + Storage + RLS + Edge Functions + Realtime |
| Calc engines | Pure TS in `src/engine/*` | Mirrored server-side in edge functions |

## Layering / directory map

```
src/
  engine/          Pure, dependency-free business logic (source of truth)
    units.ts         Unit-of-sale metadata + coverage→units conversion
    calculators.ts   Material calculators (bricks, concrete, tiles, paint, …)
    vehicleMatching.ts  Delivery vehicle-matching engine
    delivery.ts      Delivery pricing
  lib/
    supabase.ts      Client (env-only creds; null when unconfigured)
    catalog.ts       Catalogue data access (Supabase → seed fallback)
    logistics.ts     Wires cart → engine (client preview)
    utils.ts         cn / localized text / money formatting
  data/              Bundled seed data (mirrors supabase/seed.sql) for offline dev
  types/domain.ts    Shared domain types (map onto DB schema)
  i18n/              i18next config + en/ar locale JSON
  context/           CartContext (+ future Auth)
  hooks/useLocale.ts Locale + direction + switcher
  components/
    layout/          Header, Footer, AppLayout, LanguageSwitcher
    ui/              Button, Card, Badge, Skeleton, EmptyState
    product/         ProductCard, VariantTable
    ai/              AiAssistantButton (ordering assistant)
  pages/             Route components
supabase/
  migrations/        0001_core_schema.sql, 0002_rls_policies.sql
  seed.sql           Sample data (testing only)
  functions/         Edge functions (match-vehicle, + future payment/ai)
docs/                Architecture deliverables (this folder)
```

## Key architectural principles (from the spec)

1. **No operational data hard-coded in the frontend** (AC #19). Products,
   vehicles, categories, prices, translations, zones all come from the database.
   `src/data/*` is a *development fallback* only, kept in lockstep with
   `supabase/seed.sql`, and is bypassed the moment Supabase env vars are present.
2. **Server-authoritative money & logistics** (§18, §36). Price, tax, delivery
   fee, vehicle selection, payment status and stock are (re)computed by
   Supabase Edge Functions / RLS-protected RPC — never trusted from the browser.
   The client engines produce *previews* using the identical algorithm.
3. **Bilingual by schema** (§4). Content tables carry paired `*_en` / `*_ar`
   columns; `translation_status` tracks completeness for the admin dashboard.
4. **Immutable order snapshots** (Additional Req 1). Orders store a frozen
   `delivery_address_snapshot` (jsonb) plus `address_versions`, so later edits to
   a saved address never rewrite historical orders.
5. **Constrained AI** (Additional Req 2). The assistant calls controlled tools
   (search catalogue, check inventory, calculate, create *draft* cart, confirm
   address, submit confirmed order). It has no direct DB write access and cannot
   finalise an order without explicit customer confirmation.

## Environment / secrets

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed to the client.
All privileged secrets (service-role key, payment provider, maps, SMS, WhatsApp,
AI/STT providers) live exclusively in Supabase Edge Function secrets. See
`docs/INTEGRATIONS.md`.
```
