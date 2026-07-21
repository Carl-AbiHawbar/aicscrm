import type { UnitOfSale } from '@/types/domain'

/**
 * Unit-of-sale metadata. Conversion between abstract demand (e.g. m² of tiles)
 * and sellable units (boxes) is driven by per-product `coveragePerUnit`, never
 * hard-coded here. This module only holds display + rounding helpers.
 */

export const UNIT_LABELS: Record<UnitOfSale, { en: string; ar: string; short_en: string; short_ar: string }> = {
  piece: { en: 'Piece', ar: 'قطعة', short_en: 'pc', short_ar: 'قطعة' },
  pack: { en: 'Pack', ar: 'حزمة', short_en: 'pack', short_ar: 'حزمة' },
  box: { en: 'Box', ar: 'صندوق', short_en: 'box', short_ar: 'صندوق' },
  bag: { en: 'Bag', ar: 'كيس', short_en: 'bag', short_ar: 'كيس' },
  roll: { en: 'Roll', ar: 'لفة', short_en: 'roll', short_ar: 'لفة' },
  metre: { en: 'Metre', ar: 'متر', short_en: 'm', short_ar: 'م' },
  square_metre: { en: 'Square metre', ar: 'متر مربع', short_en: 'm²', short_ar: 'م²' },
  cubic_metre: { en: 'Cubic metre', ar: 'متر مكعب', short_en: 'm³', short_ar: 'م³' },
  kilogram: { en: 'Kilogram', ar: 'كيلوغرام', short_en: 'kg', short_ar: 'كغ' },
  tonne: { en: 'Tonne', ar: 'طن', short_en: 't', short_ar: 'طن' },
  pallet: { en: 'Pallet', ar: 'منصة', short_en: 'pallet', short_ar: 'منصة' },
  sheet: { en: 'Sheet', ar: 'لوح', short_en: 'sheet', short_ar: 'لوح' },
  panel: { en: 'Panel', ar: 'بلاطة', short_en: 'panel', short_ar: 'بلاطة' },
  set: { en: 'Set', ar: 'طقم', short_en: 'set', short_ar: 'طقم' },
}

export interface CoverageResult {
  /** raw coverage demand after waste allowance (e.g. m² needed) */
  demandWithWaste: number
  /** whole sellable units required to satisfy demand */
  unitsRequired: number
  /** effective coverage the purchased units provide */
  coverageProvided: number
  /** leftover coverage beyond demand */
  surplus: number
}

/**
 * Convert a coverage demand (area/length/volume) into whole sellable units,
 * applying a waste allowance and rounding UP to full packs. This is the
 * canonical conversion used by calculators and the AI assistant.
 */
export function coverageToUnits(
  demand: number,
  coveragePerUnit: number,
  wastePct = 0,
): CoverageResult {
  if (demand <= 0 || coveragePerUnit <= 0) {
    return { demandWithWaste: 0, unitsRequired: 0, coverageProvided: 0, surplus: 0 }
  }
  const demandWithWaste = demand * (1 + wastePct / 100)
  const unitsRequired = Math.ceil(demandWithWaste / coveragePerUnit)
  const coverageProvided = unitsRequired * coveragePerUnit
  return {
    demandWithWaste: round(demandWithWaste, 4),
    unitsRequired,
    coverageProvided: round(coverageProvided, 4),
    surplus: round(coverageProvided - demandWithWaste, 4),
  }
}

/** Round a raw quantity up to the next valid increment given a min quantity. */
export function roundToIncrement(qty: number, increment: number, min: number): number {
  const inc = increment > 0 ? increment : 1
  const stepped = Math.ceil(qty / inc) * inc
  return Math.max(stepped, min)
}

export function round(value: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round((value + Number.EPSILON) * f) / f
}
