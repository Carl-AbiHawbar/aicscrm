import type { Vehicle } from '@/types/domain'
import type { VehicleMatchResult } from './vehicleMatching'

/**
 * Delivery pricing. MUST be treated as an estimate on the client — the
 * authoritative price is computed by the Supabase edge function using the same
 * formula so customers cannot manipulate fees from the browser.
 */

export type DeliveryUrgency = 'economy' | 'standard' | 'express' | 'same_day'

export interface SiteAccess {
  floor?: number
  hasElevator?: boolean
  manualCarry?: boolean
  craneOnSite?: boolean
  forkliftOnSite?: boolean
  restrictedAccess?: boolean
}

export interface DeliveryPriceInput {
  match: VehicleMatchResult
  distanceKm: number
  urgency: DeliveryUrgency
  access?: SiteAccess
}

export interface DeliveryPriceResult {
  /** null when the order requires a manual delivery quotation */
  totalMinor: number | null
  breakdown: { key: string; labelEn: string; labelAr: string; amountMinor: number }[]
  requiresManualQuote: boolean
}

const URGENCY_MULTIPLIER: Record<DeliveryUrgency, number> = {
  economy: 0.9,
  standard: 1,
  express: 1.35,
  same_day: 1.6,
}

const CRANE_SURCHARGE_MINOR = 25000
const MANUAL_CARRY_PER_FLOOR_MINOR = 1500

export function estimateDeliveryPrice(input: DeliveryPriceInput): DeliveryPriceResult {
  const { match, distanceKm, urgency, access } = input

  if (match.status === 'quotation_required') {
    return { totalMinor: null, breakdown: [], requiresManualQuote: true }
  }

  const vehicles: Vehicle[] =
    match.status === 'matched' && match.vehicle ? [match.vehicle] : match.vehicles
  if (vehicles.length === 0) {
    return { totalMinor: null, breakdown: [], requiresManualQuote: true }
  }

  const breakdown: DeliveryPriceResult['breakdown'] = []
  const mult = URGENCY_MULTIPLIER[urgency]
  let total = 0

  vehicles.forEach((v, i) => {
    const fare = v.baseFareMinor + v.perKmMinor * distanceKm
    const charged = Math.max(fare, v.minChargeMinor) * mult
    total += charged
    breakdown.push({
      key: `vehicle_${i}`,
      labelEn: `${v.name.en} (base + ${distanceKm} km${vehicles.length > 1 ? `, unit ${i + 1}` : ''})`,
      labelAr: `${v.name.ar} (أساسي + ${distanceKm} كم${vehicles.length > 1 ? `، مركبة ${i + 1}` : ''})`,
      amountMinor: Math.round(charged),
    })
  })

  if (match.metrics.craneRequired) {
    total += CRANE_SURCHARGE_MINOR
    breakdown.push({ key: 'crane', labelEn: 'Crane handling', labelAr: 'خدمة الرافعة', amountMinor: CRANE_SURCHARGE_MINOR })
  }

  if (access?.manualCarry && access.floor && access.floor > 0 && !access.hasElevator) {
    const surcharge = access.floor * MANUAL_CARRY_PER_FLOOR_MINOR
    total += surcharge
    breakdown.push({
      key: 'manual_carry',
      labelEn: `Manual carry (${access.floor} floors)`,
      labelAr: `حمل يدوي (${access.floor} طوابق)`,
      amountMinor: surcharge,
    })
  }

  return { totalMinor: Math.round(total), breakdown, requiresManualQuote: false }
}
