# Page Map

Deliverable #4 (§44). Routes are declared in `src/App.tsx`. Status key:
**Live** = implemented & wired · **Scaffold** = routed placeholder tracked in
`ROADMAP.md`.

## Storefront

| Path | Page | Status |
|------|------|--------|
| `/` | Home (hero, categories, projects, calculators, featured, delivery, pros, contractor) | Live |
| `/shop` | Shop (paginated grid, sort) | Live |
| `/category/:slug` | Category listing | Live |
| `/search?q=` | Search results | Live |
| `/product/:slug` | Product detail (gallery, variant table, specs, install actions) | Live |
| `/cart` | Cart (weights, volume, vehicle match, delivery estimate, warnings) | Live |
| `/checkout` | Checkout (address confirmation, payment, COD) | Scaffold |
| `/track` | Track order | Live (lookup UI) |

## Calculators & projects

| Path | Page | Status |
|------|------|--------|
| `/calculators` | Calculator index (14 calculators) | Live |
| `/calculators/:id` | Individual calculator (dynamic form + result) | Live |
| `/projects`, `/projects/:id` | Saved projects | Scaffold |

## Quotations

| Path | Page | Status |
|------|------|--------|
| `/quote` | Material quotation request (BoQ upload) | Scaffold |
| `/quote/:id` | Material quotation details | Scaffold |

## Handyman marketplace

| Path | Page | Status |
|------|------|--------|
| `/handymen` | Find a handyman (all pros) | Live |
| `/handymen/:slug` | Filter by service category | Live |
| `/handymen/request` | Handyman request form | Scaffold |
| service quotation comparison, appointments | | Scaffold |

## Accounts

| Path | Page | Status |
|------|------|--------|
| `/login`, `/register` | Auth (Supabase) | Live |
| `/register/contractor` | Contractor registration | Scaffold |
| Customer dashboard, profile, orders, order detail | | Scaffold |

## Operations dashboards

| Path | Page | Status |
|------|------|--------|
| `/admin/*` | Admin dashboard (products, orders, logistics, quotations, pros, translations, AI, settings, audit) | Scaffold |
| Driver dashboard, Warehouse dashboard | | Scaffold |

## AI & address (Additional Requirements)

| Interface | Where | Status |
|-----------|-------|--------|
| AI ordering assistant | Floating button (all pages) + entry points | Live (draft-cart flow) |
| Voice-note / uploaded-list review | AI panel | Scaffold |
| Mandatory address confirmation | Checkout step | Scaffold |
| Address-change request | Order detail | Scaffold |
| Human-support conversation | AI panel escalation | Scaffold |

## Content

About, Contact, FAQ, Delivery info, Returns, Privacy, Terms → `/help` group
(Scaffold).
```
