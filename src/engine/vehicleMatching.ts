import type { CartLine, Vehicle } from '@/types/domain'

/**
 * Delivery vehicle-matching engine.
 *
 * Selects the SMALLEST valid vehicle that can carry an order, evaluating
 * weight, volume, item dimensions, pallet capacity, handling equipment,
 * covered-cargo needs and destination-zone eligibility — never weight alone.
 *
 * This module is intentionally pure and dependency-free so the identical logic
 * can run in a Supabase edge function (server-side authority) and in the
 * browser for instant cart estimates. The server result is always canonical.
 */

export interface OrderMetrics {
  totalWeightKg: number
  totalVolumeCm3: number
  longestItemCm: number
  widestItemCm: number
  tallestItemCm: number
  palletCount: number
  hasNonStackable: boolean
  hasFragile: boolean
  hasOversized: boolean
  hasHazardous: boolean
  craneRequired: boolean
  forkliftRequired: boolean
  coveredRequired: boolean
}

export type MatchStatus = 'matched' | 'multi_vehicle' | 'quotation_required'

export interface VehicleMatchResult {
  status: MatchStatus
  metrics: OrderMetrics
  /** chosen vehicle for a single-vehicle order (if any) */
  vehicle: Vehicle | null
  /** vehicles proposed for a multi-vehicle split (best-effort estimate) */
  vehicles: Vehicle[]
  /** distance-independent capacity reasons the order could not be matched */
  reasons: string[]
  warnings: string[]
}

export interface MatchOptions {
  /** e.g. 0.85 => only load a vehicle to 85% of payload & volume */
  safetyFactor: number
  /** destination delivery zone id; when set, vehicle must serve it */
  zoneId?: string | null
}

const DEFAULT_OPTIONS: MatchOptions = { safetyFactor: 0.85 }

/** Aggregate physical + handling metrics for an order. */
export function computeOrderMetrics(lines: CartLine[]): OrderMetrics {
  const m: OrderMetrics = {
    totalWeightKg: 0,
    totalVolumeCm3: 0,
    longestItemCm: 0,
    widestItemCm: 0,
    tallestItemCm: 0,
    palletCount: 0,
    hasNonStackable: false,
    hasFragile: false,
    hasOversized: false,
    hasHazardous: false,
    craneRequired: false,
    forkliftRequired: false,
    coveredRequired: false,
  }

  for (const line of lines) {
    const h = line.variant.handling
    const qty = line.quantity

    m.totalWeightKg += h.unitWeightKg * qty

    if (h.palletised && h.qtyPerPallet && h.qtyPerPallet > 0) {
      // pallet footprint dominates the volume + item dimensions
      m.palletCount += Math.ceil(qty / h.qtyPerPallet)
      const pl = h.palletLengthCm ?? h.packagedLengthCm
      const pw = h.palletWidthCm ?? h.packagedWidthCm
      const ph = h.palletHeightCm ?? h.packagedHeightCm
      m.totalVolumeCm3 += pl * pw * ph * Math.ceil(qty / h.qtyPerPallet)
      m.longestItemCm = Math.max(m.longestItemCm, pl)
      m.widestItemCm = Math.max(m.widestItemCm, pw)
      m.tallestItemCm = Math.max(m.tallestItemCm, ph)
    } else {
      m.totalVolumeCm3 += h.packagedLengthCm * h.packagedWidthCm * h.packagedHeightCm * qty
      m.longestItemCm = Math.max(m.longestItemCm, h.packagedLengthCm)
      m.widestItemCm = Math.max(m.widestItemCm, h.packagedWidthCm)
      m.tallestItemCm = Math.max(m.tallestItemCm, h.packagedHeightCm)
    }

    if (!h.stackable) m.hasNonStackable = true
    if (h.fragile) m.hasFragile = true
    if (h.oversized) m.hasOversized = true
    if (h.hazardous) m.hasHazardous = true
    if (h.craneRequired) m.craneRequired = true
    if (h.forkliftRequired) m.forkliftRequired = true
    if (h.coveredVehicleRequired) m.coveredRequired = true
  }

  m.totalWeightKg = round2(m.totalWeightKg)
  m.totalVolumeCm3 = Math.round(m.totalVolumeCm3)
  return m
}

/** Whether a single vehicle can satisfy all constraints for the metrics. */
function vehicleSatisfies(
  vehicle: Vehicle,
  m: OrderMetrics,
  opts: MatchOptions,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = []
  const sf = opts.safetyFactor

  if (opts.zoneId && !vehicle.zoneIds.includes(opts.zoneId)) {
    reasons.push('zone_not_served')
  }
  if (m.totalWeightKg > vehicle.maxPayloadKg * sf) reasons.push('payload_exceeded')
  if (m.totalVolumeCm3 > vehicle.cargoVolumeCm3 * sf) reasons.push('volume_exceeded')
  if (m.longestItemCm > vehicle.maxItemLengthCm) reasons.push('length_exceeded')
  if (m.widestItemCm > vehicle.maxItemWidthCm) reasons.push('width_exceeded')
  if (m.tallestItemCm > vehicle.maxItemHeightCm) reasons.push('height_exceeded')
  if (m.palletCount > vehicle.palletCapacity) reasons.push('pallet_capacity_exceeded')
  if (m.coveredRequired && !vehicle.covered) reasons.push('covered_required')
  if (m.craneRequired && !vehicle.craneAvailable) reasons.push('crane_required')
  if (m.forkliftRequired && !vehicle.forkliftCompatible) reasons.push('forklift_required')

  return { ok: reasons.length === 0, reasons }
}

/** Rough "size" ordering used to pick the smallest adequate vehicle. */
function vehicleSize(v: Vehicle): number {
  return v.maxPayloadKg + v.cargoVolumeCm3 / 1_000_000
}

export function matchVehicle(
  lines: CartLine[],
  vehicles: Vehicle[],
  options: Partial<MatchOptions> = {},
): VehicleMatchResult {
  const opts: MatchOptions = { ...DEFAULT_OPTIONS, ...options }
  const metrics = computeOrderMetrics(lines)
  const warnings: string[] = []

  if (metrics.hasOversized) warnings.push('oversized_item')
  if (metrics.craneRequired) warnings.push('crane_required')
  if (metrics.forkliftRequired) warnings.push('forklift_required')
  if (metrics.hasHazardous) warnings.push('hazardous_restricted')
  if (metrics.hasFragile) warnings.push('fragile_handling')

  if (lines.length === 0) {
    return { status: 'quotation_required', metrics, vehicle: null, vehicles: [], reasons: ['empty_order'], warnings }
  }

  const active = vehicles.filter((v) => v.active).sort((a, b) => vehicleSize(a) - vehicleSize(b))

  // 1) try a single vehicle (smallest adequate)
  const collectedReasons = new Set<string>()
  for (const v of active) {
    const check = vehicleSatisfies(v, metrics, opts)
    if (check.ok) {
      return { status: 'matched', metrics, vehicle: v, vehicles: [v], reasons: [], warnings }
    }
    check.reasons.forEach((r) => collectedReasons.add(r))
  }

  // 2) single vehicle impossible. If failures are purely capacity (weight/volume/
  //    pallets) and items themselves fit *some* vehicle dimensionally, propose a
  //    multi-vehicle split using the largest suitable-by-dimension vehicle.
  const dimensionalBlock =
    collectedReasons.has('length_exceeded') ||
    collectedReasons.has('width_exceeded') ||
    collectedReasons.has('height_exceeded') ||
    collectedReasons.has('crane_required') ||
    collectedReasons.has('forklift_required') ||
    collectedReasons.has('covered_required') ||
    collectedReasons.has('zone_not_served')

  if (!dimensionalBlock) {
    // largest active vehicle serving the zone
    const serving = active.filter((v) => !opts.zoneId || v.zoneIds.includes(opts.zoneId))
    const largest = serving[serving.length - 1]
    if (largest) {
      const perVehicleWeight = largest.maxPayloadKg * opts.safetyFactor
      const perVehicleVolume = largest.cargoVolumeCm3 * opts.safetyFactor
      const perVehiclePallets = largest.palletCapacity || Infinity
      const byWeight = Math.ceil(metrics.totalWeightKg / perVehicleWeight)
      const byVolume = Math.ceil(metrics.totalVolumeCm3 / perVehicleVolume)
      const byPallet = perVehiclePallets === Infinity ? 1 : Math.ceil(metrics.palletCount / perVehiclePallets)
      const count = Math.max(byWeight, byVolume, byPallet, 2)
      warnings.push('multiple_vehicles_required')
      return {
        status: 'multi_vehicle',
        metrics,
        vehicle: null,
        vehicles: Array.from({ length: count }, () => largest),
        reasons: Array.from(collectedReasons),
        warnings,
      }
    }
  }

  // 3) cannot confidently match -> logistics must quote manually
  warnings.push('delivery_quotation_required')
  return {
    status: 'quotation_required',
    metrics,
    vehicle: null,
    vehicles: [],
    reasons: Array.from(collectedReasons),
    warnings,
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
