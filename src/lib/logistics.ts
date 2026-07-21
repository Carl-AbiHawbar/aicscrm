import type { CartLine } from '@/types/domain'
import { matchVehicle, type VehicleMatchResult } from '@/engine/vehicleMatching'
import { estimateDeliveryPrice, type DeliveryPriceResult, type DeliveryUrgency, type SiteAccess } from '@/engine/delivery'
import { VEHICLES } from '@/data/logistics'
import { isSupabaseConfigured } from './supabase'

const SAFETY_FACTOR = 0.85

/**
 * Client-side delivery estimate. Uses the same engine that runs server-side.
 * When Supabase is configured the authoritative figures come from the
 * `match-vehicle` edge function; this local result is only a live preview.
 */
export function estimateDelivery(
  lines: CartLine[],
  opts: { zoneId?: string | null; distanceKm?: number; urgency?: DeliveryUrgency; access?: SiteAccess } = {},
): { match: VehicleMatchResult; price: DeliveryPriceResult } {
  const match = matchVehicle(lines, VEHICLES, { safetyFactor: SAFETY_FACTOR, zoneId: opts.zoneId ?? null })
  const price = estimateDeliveryPrice({
    match,
    distanceKm: opts.distanceKm ?? 15,
    urgency: opts.urgency ?? 'standard',
    access: opts.access,
  })
  return { match, price }
}

export const usingServerAuthority = isSupabaseConfigured
