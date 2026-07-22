# Build Roadmap & Status

Honest status of each spec stage (§42). This session delivered the **Stage 1
foundation**, the three signature engines, the core commerce surface, and the
complete database schema + docs. Later stages are scaffolded on the same schema
(no disconnected prototypes) and tracked here.

## Legend
✅ Done · 🟡 Partial (functional slice) · ⬜ Scaffolded / planned

## Stage 1 — Foundation
- ✅ Supabase client + env-only credentials
- ✅ Database schema (~90 tables), indexes, soft deletes
- ✅ RLS policies + role helpers (`has_role`/`is_admin`/`is_staff`)
- ✅ EN/AR i18n + full RTL (`<html dir>` sync, logical Tailwind utilities)
- ✅ Design system + tokens, layout, header/nav, language switcher
- 🟡 Auth (email/password via Supabase; role-based route guards planned)

## Stage 2 — Commerce
- ✅ Categories, product list/grid, category & search pages, pagination, sort
- ✅ Product page (gallery, specs, install actions, breadcrumbs)
- ✅ Variant **table** selector (per-variant price/stock/qty/add)
- ✅ Cart with live weight/volume/vehicle/delivery + warnings
- ✅ Unit-of-sale + coverage conversion engine
- ⬜ Checkout, payments (card + COD workflows), server order creation
- ⬜ Inventory reservation / oversell prevention (schema + rules defined)
- ⬜ Dynamic per-category filters, comparison, recently-viewed

## Stage 3 — Calculations & quotations
- ✅ 14 material calculators (pure functions, EN/AR, waste + rounding)
- ⬜ Save calc → project; project → cart; BoQ upload; quotation workflow UI

## Stage 4 — Logistics
- ✅ Vehicle-matching **engine** (client preview + `match-vehicle` edge fn)
- ✅ Delivery pricing engine (server-authoritative design)
- ✅ Vehicles + zones schema & seed
- ⬜ Driver dashboard, delivery tracking, assignments UI, overrides UI

## Stage 5 — Handyman marketplace
- 🟡 Service categories + professional directory (browse/filter) — Live
- ⬜ Professional registration/verification, job requests, matching, quotations,
  appointments, reviews, disputes (schema complete)

## Stage 6 — Administration & reporting
- ⬜ Admin dashboard (all sections), bulk import/export, translation manager,
  reporting/analytics, audit-log viewer (schema + `translation_status` +
  `audit_logs` in place)

## Additional Requirement 1 — Address confirmation
- ✅ Schema: `construction_sites`, `address_versions`,
  `order_address_confirmations`, `order_address_change_requests`, immutable
  `orders.delivery_address_snapshot`
- ⬜ Mandatory confirmation UI step + change-request approval flows

## Additional Requirement 2 — AI ordering assistant
- ✅ End-to-end assistant flow (demo): input → **voice transcription** →
  transcript review/correction → catalogue match (synonyms, confidence tiers) →
  editable **draft cart** → **mandatory address confirmation** → server-style
  delivery/vehicle calculation → **final order summary** → explicit
  confirmation buttons (Confirm & Proceed to Payment / Confirm Cash on Delivery /
  Edit Order / Change Address / Speak to Support) → order created. EN/AR + RTL.
- ✅ Voice transcription via Web Speech API (`src/ai/useSpeechRecognition.ts`),
  language selectable (EN/AR); never orders from an unconfirmed transcription.
- ✅ AI schema (conversations, messages, voice notes, transcriptions, extracted
  requests, matches, clarifications, draft carts, confirmations, escalations,
  `product_synonyms`)
- ⬜ Production backend: LLM extraction + server STT edge functions, file/upload
  ingestion, persistence to `ai_*` tables, real payment redirect, live human
  escalation handoff (the demo runs client-side with the deterministic matcher).

## Cross-cutting
- ✅ No operational data hard-coded in components (seed fallback isolated in
  `src/data`, bypassed when Supabase configured)
- ✅ Money in minor units; server-authoritative pricing design
- ⬜ SEO (dynamic titles/meta, structured data, sitemap), notifications delivery
```
