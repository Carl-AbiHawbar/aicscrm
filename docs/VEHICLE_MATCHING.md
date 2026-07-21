# Vehicle-Matching Logic

Deliverable #9 (§44). Implementation: `src/engine/vehicleMatching.ts` (client
preview) and `supabase/functions/match-vehicle/index.ts` (authoritative). The
engine **never** decides on weight alone (§16).

## Inputs

Per cart line, from `product_variants` handling columns:
weight, packaged L/W/H, stackable, max stack qty, fragile, upright-only,
oversized, hazardous, palletised (+ pallet dims + qty/pallet), crane required,
forklift required, covered-vehicle required, open-truck allowed.

Per vehicle, from `vehicles`: payload, cargo L/W/H + volume, max item L/W/H,
pallet capacity, covered, tail-lift, crane, forklift-compatible, served zones,
fares. Plus a configurable **safety-capacity %** from `system_settings.delivery`
(default 85%).

## Step 1 — Aggregate order metrics

For each line:
- `totalWeightKg += unitWeight × qty`
- If palletised: `palletCount += ceil(qty / qtyPerPallet)`, and volume + item
  dimensions use the **pallet footprint**. Otherwise use packaged dimensions ×
  qty for volume and the packaged L/W/H for longest/widest/tallest.
- OR-reduce the handling flags: crane/forklift/covered required, fragile,
  oversized, hazardous.

## Step 2 — Test each vehicle (smallest first)

Vehicles sorted ascending by a size proxy (`payload + volume/1e6`). A vehicle is
valid only if **all** hold (with safety factor `sf` applied to capacity):

```
weight   ≤ payload × sf
volume   ≤ cargoVolume × sf
longest  ≤ maxItemLength
widest   ≤ maxItemWidth
tallest  ≤ maxItemHeight
pallets  ≤ palletCapacity
covered  ⇒ vehicle.covered
crane    ⇒ vehicle.craneAvailable
forklift ⇒ vehicle.forkliftCompatible
zone     ⇒ vehicle serves destination zone
```

Example safety factor: a 1000 kg vehicle at 85% may carry ≤ 850 kg.

## Step 3 — Decide

1. **matched** — first (smallest) vehicle passing all constraints.
2. **multi_vehicle** — no single vehicle fits, but failures are *purely
   capacity* (weight/volume/pallets) and items fit dimensionally in some
   vehicle. Propose `ceil` split across the largest zone-serving vehicle
   (`max(byWeight, byVolume, byPallets, 2)`).
3. **quotation_required** — a hard/dimensional constraint blocks all vehicles
   (oversized beyond any bed, crane/forklift/covered unavailable, or zone not
   served). Order → `awaiting_delivery_quotation`; logistics quotes manually and
   the override reason is written to `audit_logs`.

## Warnings surfaced to the cart

`oversized_item`, `crane_required`, `forklift_required`, `hazardous_restricted`,
`fragile_handling`, `multiple_vehicles_required`, `delivery_quotation_required`.

## Pricing (`delivery.ts`)

```
per-vehicle = max(baseFare + perKm × distance, minCharge) × urgencyMultiplier
+ crane surcharge (if crane required)
+ manual-carry surcharge (floors × rate, when no elevator)
```
Urgency multipliers: economy 0.9, standard 1.0, express 1.35, same-day 1.6.
Delivery price is computed **server-side** so it cannot be manipulated (§18).

## Worked example

Order: 60 cement bags (50 kg, palletised 60/pallet) + 4 tile boxes (24 kg,
fragile, forklift, covered).
- weight = 60×50 + 4×24 = 3096 kg
- pallets = 1 (cement) + ceil(4/40)=1 (tiles) = 2
- flags: forklift + covered required
- Smallest vehicle meeting 3096 kg (÷0.85 ⇒ needs ≥ 3643 kg payload), 2 pallets,
  covered, forklift-compatible → **Light Truck** (3500 kg? fails 85% ⇒ next:
  **Medium Truck** 8000 kg, covered, forklift ✓). Result: `matched` = Medium Truck.
```
