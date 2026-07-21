import type { Bilingual, Vehicle } from '@/types/domain'

export interface DeliveryZone {
  id: string
  name: Bilingual
  codPostcodes: string[]
  codEligible: boolean
}

export const ZONES: DeliveryZone[] = [
  { id: 'zone-central', name: { en: 'Central City', ar: 'وسط المدينة' }, codPostcodes: ['11564', '11543'], codEligible: true },
  { id: 'zone-north', name: { en: 'North District', ar: 'الحي الشمالي' }, codPostcodes: ['13511'], codEligible: true },
  { id: 'zone-industrial', name: { en: 'Industrial Zone', ar: 'المنطقة الصناعية' }, codPostcodes: ['14325'], codEligible: false },
  { id: 'zone-suburb', name: { en: 'Southern Suburbs', ar: 'الضواحي الجنوبية' }, codPostcodes: ['16278'], codEligible: true },
  { id: 'zone-outer', name: { en: 'Outer Region', ar: 'المنطقة الخارجية' }, codPostcodes: ['19999'], codEligible: false },
]

const ALL_ZONES = ZONES.map((z) => z.id)
const URBAN_ZONES = ['zone-central', 'zone-north', 'zone-suburb']

export const VEHICLES: Vehicle[] = [
  {
    id: 'veh-moto', category: 'motorcycle', name: { en: 'Delivery Motorcycle', ar: 'دراجة نارية للتوصيل' },
    maxPayloadKg: 30, cargoLengthCm: 50, cargoWidthCm: 40, cargoHeightCm: 40, cargoVolumeCm3: 50 * 40 * 40,
    maxItemLengthCm: 50, maxItemWidthCm: 40, maxItemHeightCm: 40, palletCapacity: 0, covered: true, tailLift: false,
    craneAvailable: false, forkliftCompatible: false, zoneIds: URBAN_ZONES, baseFareMinor: 1500, perKmMinor: 200, minChargeMinor: 1500, active: true,
  },
  {
    id: 'veh-car', category: 'car', name: { en: 'Delivery Car', ar: 'سيارة توصيل' },
    maxPayloadKg: 120, cargoLengthCm: 120, cargoWidthCm: 90, cargoHeightCm: 80, cargoVolumeCm3: 120 * 90 * 80,
    maxItemLengthCm: 130, maxItemWidthCm: 90, maxItemHeightCm: 80, palletCapacity: 0, covered: true, tailLift: false,
    craneAvailable: false, forkliftCompatible: false, zoneIds: URBAN_ZONES, baseFareMinor: 2500, perKmMinor: 250, minChargeMinor: 2500, active: true,
  },
  {
    id: 'veh-svan', category: 'small_van', name: { en: 'Small Van', ar: 'فان صغير' },
    maxPayloadKg: 800, cargoLengthCm: 240, cargoWidthCm: 140, cargoHeightCm: 130, cargoVolumeCm3: 240 * 140 * 130,
    maxItemLengthCm: 250, maxItemWidthCm: 140, maxItemHeightCm: 130, palletCapacity: 1, covered: true, tailLift: false,
    craneAvailable: false, forkliftCompatible: false, zoneIds: ALL_ZONES, baseFareMinor: 4000, perKmMinor: 300, minChargeMinor: 5000, active: true,
  },
  {
    id: 'veh-lvan', category: 'large_van', name: { en: 'Large Van', ar: 'فان كبير' },
    maxPayloadKg: 1400, cargoLengthCm: 340, cargoWidthCm: 170, cargoHeightCm: 180, cargoVolumeCm3: 340 * 170 * 180,
    maxItemLengthCm: 350, maxItemWidthCm: 170, maxItemHeightCm: 180, palletCapacity: 2, covered: true, tailLift: true,
    craneAvailable: false, forkliftCompatible: true, zoneIds: ALL_ZONES, baseFareMinor: 6000, perKmMinor: 350, minChargeMinor: 7000, active: true,
  },
  {
    id: 'veh-pickup', category: 'pickup_truck', name: { en: 'Pickup Truck', ar: 'شاحنة بيك أب' },
    maxPayloadKg: 1000, cargoLengthCm: 240, cargoWidthCm: 160, cargoHeightCm: 50, cargoVolumeCm3: 240 * 160 * 50,
    maxItemLengthCm: 300, maxItemWidthCm: 160, maxItemHeightCm: 200, palletCapacity: 1, covered: false, tailLift: false,
    craneAvailable: false, forkliftCompatible: true, zoneIds: ALL_ZONES, baseFareMinor: 5000, perKmMinor: 320, minChargeMinor: 6000, active: true,
  },
  {
    id: 'veh-light', category: 'light_truck', name: { en: 'Light Truck', ar: 'شاحنة خفيفة' },
    maxPayloadKg: 3500, cargoLengthCm: 430, cargoWidthCm: 200, cargoHeightCm: 210, cargoVolumeCm3: 430 * 200 * 210,
    maxItemLengthCm: 450, maxItemWidthCm: 200, maxItemHeightCm: 210, palletCapacity: 4, covered: true, tailLift: true,
    craneAvailable: false, forkliftCompatible: true, zoneIds: ALL_ZONES, baseFareMinor: 9000, perKmMinor: 450, minChargeMinor: 12000, active: true,
  },
  {
    id: 'veh-medium', category: 'medium_truck', name: { en: 'Medium Truck', ar: 'شاحنة متوسطة' },
    maxPayloadKg: 8000, cargoLengthCm: 620, cargoWidthCm: 240, cargoHeightCm: 240, cargoVolumeCm3: 620 * 240 * 240,
    maxItemLengthCm: 650, maxItemWidthCm: 240, maxItemHeightCm: 240, palletCapacity: 8, covered: true, tailLift: true,
    craneAvailable: false, forkliftCompatible: true, zoneIds: ALL_ZONES, baseFareMinor: 15000, perKmMinor: 600, minChargeMinor: 20000, active: true,
  },
  {
    id: 'veh-flatbed', category: 'flatbed_truck', name: { en: 'Flatbed Truck', ar: 'شاحنة مسطحة' },
    maxPayloadKg: 12000, cargoLengthCm: 1300, cargoWidthCm: 250, cargoHeightCm: 300, cargoVolumeCm3: 1300 * 250 * 300,
    maxItemLengthCm: 1300, maxItemWidthCm: 250, maxItemHeightCm: 300, palletCapacity: 12, covered: false, tailLift: false,
    craneAvailable: false, forkliftCompatible: true, zoneIds: ALL_ZONES, baseFareMinor: 22000, perKmMinor: 800, minChargeMinor: 30000, active: true,
  },
  {
    id: 'veh-crane', category: 'crane_truck', name: { en: 'Crane Truck', ar: 'شاحنة رافعة' },
    maxPayloadKg: 15000, cargoLengthCm: 1300, cargoWidthCm: 250, cargoHeightCm: 300, cargoVolumeCm3: 1300 * 250 * 300,
    maxItemLengthCm: 1300, maxItemWidthCm: 250, maxItemHeightCm: 300, palletCapacity: 12, covered: false, tailLift: false,
    craneAvailable: true, forkliftCompatible: true, zoneIds: ALL_ZONES, baseFareMinor: 35000, perKmMinor: 900, minChargeMinor: 45000, active: true,
  },
]
