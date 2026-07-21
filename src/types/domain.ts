/**
 * Core domain types shared by the frontend, calculation engines and the
 * (mirrored) backend edge functions. These map onto the Supabase schema in
 * supabase/migrations. Keep field names in sync with the database.
 */

export type Locale = 'en' | 'ar'

export type UnitOfSale =
  | 'piece'
  | 'pack'
  | 'box'
  | 'bag'
  | 'roll'
  | 'metre'
  | 'square_metre'
  | 'cubic_metre'
  | 'kilogram'
  | 'tonne'
  | 'pallet'
  | 'sheet'
  | 'panel'
  | 'set'

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder'

export interface Bilingual {
  en: string
  ar: string
}

/** Physical + handling attributes required by the vehicle-matching engine. */
export interface HandlingProfile {
  /** kg per single sale-unit (packaged). */
  unitWeightKg: number
  packagedLengthCm: number
  packagedWidthCm: number
  packagedHeightCm: number
  stackable: boolean
  maxStackQty: number | null
  fragile: boolean
  uprightOnly: boolean
  oversized: boolean
  hazardous: boolean
  palletised: boolean
  palletLengthCm: number | null
  palletWidthCm: number | null
  palletHeightCm: number | null
  qtyPerPallet: number | null
  craneRequired: boolean
  forkliftRequired: boolean
  coveredVehicleRequired: boolean
  openTruckAllowed: boolean
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  barcode: string | null
  name: Bilingual
  priceMinor: number
  promoPriceMinor: number | null
  costMinor: number | null
  taxRatePct: number
  stockStatus: StockStatus
  availableQty: number
  minQty: number
  maxQty: number | null
  qtyIncrement: number
  imageUrl: string | null
  /** attribute code -> display value, e.g. { length: '50mm', gauge: '10' } */
  attributes: Record<string, Bilingual>
  handling: HandlingProfile
}

export interface Product {
  id: string
  slug: string
  sku: string
  categoryId: string
  brandId: string | null
  name: Bilingual
  description: Bilingual
  unitOfSale: UnitOfSale
  /** e.g. one box covers 1.44 m²; used for coverage-based ordering. */
  coveragePerUnit: number | null
  coverageUnit: 'square_metre' | 'cubic_metre' | 'metre' | null
  imageUrl: string | null
  installable: boolean
  returnEligible: boolean
  variants: ProductVariant[]
}

export type VehicleCategory =
  | 'motorcycle'
  | 'car'
  | 'small_van'
  | 'large_van'
  | 'pickup_truck'
  | 'light_truck'
  | 'medium_truck'
  | 'heavy_truck'
  | 'lorry'
  | 'crane_truck'
  | 'flatbed_truck'

export interface Vehicle {
  id: string
  name: Bilingual
  category: VehicleCategory
  maxPayloadKg: number
  cargoLengthCm: number
  cargoWidthCm: number
  cargoHeightCm: number
  cargoVolumeCm3: number
  maxItemLengthCm: number
  maxItemWidthCm: number
  maxItemHeightCm: number
  palletCapacity: number
  covered: boolean
  tailLift: boolean
  craneAvailable: boolean
  forkliftCompatible: boolean
  zoneIds: string[]
  baseFareMinor: number
  perKmMinor: number
  minChargeMinor: number
  active: boolean
}

export interface CartLine {
  variant: ProductVariant
  product: Pick<Product, 'id' | 'name' | 'unitOfSale' | 'coveragePerUnit' | 'coverageUnit'>
  quantity: number
}
