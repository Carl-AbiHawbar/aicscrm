// Supabase Edge Function: match-vehicle
// Server-authoritative delivery vehicle matching + pricing (spec §16/§18, AC #7).
//
// The browser computes a preview with the identical algorithm, but this
// function is the source of truth: it re-reads variant handling data and
// vehicle specs from the database so the customer cannot manipulate weights,
// dimensions or fees. Deploy with:  supabase functions deploy match-vehicle
//
// Request body: { items: {variant_id: string, quantity: number}[], zone_id?: string, distance_km?: number, urgency?: string }

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SAFETY_FACTOR_DEFAULT = 0.85

interface Handling {
  unit_weight_kg: number
  packaged_length_cm: number
  packaged_width_cm: number
  packaged_height_cm: number
  stackable: boolean
  fragile: boolean
  oversized: boolean
  hazardous: boolean
  palletised: boolean
  pallet_length_cm: number | null
  pallet_width_cm: number | null
  pallet_height_cm: number | null
  qty_per_pallet: number | null
  crane_required: boolean
  forklift_required: boolean
  covered_vehicle_required: boolean
}

function computeMetrics(lines: { handling: Handling; quantity: number }[]) {
  const m = {
    totalWeightKg: 0, totalVolumeCm3: 0, longestItemCm: 0, widestItemCm: 0, tallestItemCm: 0,
    palletCount: 0, craneRequired: false, forkliftRequired: false, coveredRequired: false,
    hasOversized: false, hasFragile: false, hasHazardous: false,
  }
  for (const { handling: h, quantity: q } of lines) {
    m.totalWeightKg += h.unit_weight_kg * q
    if (h.palletised && h.qty_per_pallet && h.qty_per_pallet > 0) {
      const pallets = Math.ceil(q / h.qty_per_pallet)
      m.palletCount += pallets
      const pl = h.pallet_length_cm ?? h.packaged_length_cm
      const pw = h.pallet_width_cm ?? h.packaged_width_cm
      const ph = h.pallet_height_cm ?? h.packaged_height_cm
      m.totalVolumeCm3 += pl * pw * ph * pallets
      m.longestItemCm = Math.max(m.longestItemCm, pl)
      m.widestItemCm = Math.max(m.widestItemCm, pw)
      m.tallestItemCm = Math.max(m.tallestItemCm, ph)
    } else {
      m.totalVolumeCm3 += h.packaged_length_cm * h.packaged_width_cm * h.packaged_height_cm * q
      m.longestItemCm = Math.max(m.longestItemCm, h.packaged_length_cm)
      m.widestItemCm = Math.max(m.widestItemCm, h.packaged_width_cm)
      m.tallestItemCm = Math.max(m.tallestItemCm, h.packaged_height_cm)
    }
    if (h.crane_required) m.craneRequired = true
    if (h.forklift_required) m.forkliftRequired = true
    if (h.covered_vehicle_required) m.coveredRequired = true
    if (h.oversized) m.hasOversized = true
    if (h.fragile) m.hasFragile = true
    if (h.hazardous) m.hasHazardous = true
  }
  return m
}

// deno-lint-ignore no-explicit-any
function satisfies(v: any, m: ReturnType<typeof computeMetrics>, sf: number, zoneServed: boolean) {
  const reasons: string[] = []
  if (!zoneServed) reasons.push('zone_not_served')
  if (m.totalWeightKg > v.max_payload_kg * sf) reasons.push('payload_exceeded')
  if (m.totalVolumeCm3 > v.cargo_volume_cm3 * sf) reasons.push('volume_exceeded')
  if (m.longestItemCm > v.max_item_length_cm) reasons.push('length_exceeded')
  if (m.widestItemCm > v.max_item_width_cm) reasons.push('width_exceeded')
  if (m.tallestItemCm > v.max_item_height_cm) reasons.push('height_exceeded')
  if (m.palletCount > v.pallet_capacity) reasons.push('pallet_capacity_exceeded')
  if (m.coveredRequired && !v.covered) reasons.push('covered_required')
  if (m.craneRequired && !v.crane_available) reasons.push('crane_required')
  if (m.forkliftRequired && !v.forklift_compatible) reasons.push('forklift_required')
  return reasons
}

Deno.serve(async (req) => {
  try {
    const { items, zone_id, distance_km = 15 } = await req.json()
    if (!Array.isArray(items) || items.length === 0) {
      return json({ status: 'quotation_required', reason: 'empty_order' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const variantIds = items.map((i: { variant_id: string }) => i.variant_id)
    const { data: variants, error: vErr } = await supabase
      .from('product_variants')
      .select('id,unit_weight_kg,packaged_length_cm,packaged_width_cm,packaged_height_cm,stackable,fragile,oversized,hazardous,palletised,pallet_length_cm,pallet_width_cm,pallet_height_cm,qty_per_pallet,crane_required,forklift_required,covered_vehicle_required')
      .in('id', variantIds)
    if (vErr) throw vErr

    const byId = new Map(variants!.map((v) => [v.id, v]))
    const lines = items.map((i: { variant_id: string; quantity: number }) => ({
      handling: byId.get(i.variant_id) as unknown as Handling,
      quantity: i.quantity,
    })).filter((l) => l.handling)

    const metrics = computeMetrics(lines)

    // safety factor from settings
    const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'delivery').maybeSingle()
    const sf = (setting?.value?.safety_capacity_pct ?? SAFETY_FACTOR_DEFAULT * 100) / 100

    const { data: vehicles } = await supabase.from('vehicles').select('*').eq('active', true)
    const { data: zoneLinks } = zone_id
      ? await supabase.from('vehicle_zones').select('vehicle_id').eq('zone_id', zone_id)
      : { data: null }
    const servingSet = zoneLinks ? new Set(zoneLinks.map((z) => z.vehicle_id)) : null

    const sorted = (vehicles ?? []).sort((a, b) => (a.max_payload_kg + a.cargo_volume_cm3 / 1e6) - (b.max_payload_kg + b.cargo_volume_cm3 / 1e6))

    for (const v of sorted) {
      const zoneServed = !servingSet || servingSet.has(v.id)
      const reasons = satisfies(v, metrics, sf, zoneServed)
      if (reasons.length === 0) {
        const fare = Math.max(v.base_fare_minor + v.per_km_minor * distance_km, v.min_charge_minor)
        const crane = metrics.craneRequired ? 25000 : 0
        return json({ status: 'matched', metrics, vehicle: v, delivery_minor: Math.round(fare) + crane })
      }
    }

    return json({ status: 'quotation_required', metrics, delivery_minor: null })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}
