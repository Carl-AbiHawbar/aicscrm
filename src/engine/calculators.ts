import { coverageToUnits, round } from './units'

/**
 * Reusable material-calculation functions. These are the single source of
 * truth for material estimates — the UI never computes totals itself, and the
 * AI ordering assistant calls the same functions (mirrored server-side).
 *
 * All calculators return a normalised {@link CalculatorResult} so the UI and
 * cart can render lines and add them to a project/cart consistently.
 */

export interface CalcField {
  key: string
  label: { en: string; ar: string }
  unit?: string
  type: 'number' | 'select'
  default?: number | string
  min?: number
  options?: { value: string; label: { en: string; ar: string }; data?: Record<string, number> }[]
  help?: { en: string; ar: string }
}

export interface CalculatorResultLine {
  key: string
  label: { en: string; ar: string }
  value: number
  unit: string
  /** suggested catalogue product slug/attribute to fulfil this line */
  suggests?: string
}

export interface CalculatorResult {
  lines: CalculatorResultLine[]
  notes: { en: string; ar: string }[]
}

export interface CalculatorDef {
  id: string
  name: { en: string; ar: string }
  description: { en: string; ar: string }
  icon: string
  fields: CalcField[]
  compute: (input: Record<string, number | string>) => CalculatorResult
}

const num = (input: Record<string, number | string>, key: string, fallback = 0): number => {
  const v = input[key]
  const n = typeof v === 'string' ? parseFloat(v) : v
  return Number.isFinite(n) ? (n as number) : fallback
}

const WASTE_FIELD: CalcField = {
  key: 'waste',
  label: { en: 'Waste allowance %', ar: 'نسبة الهدر %' },
  type: 'number',
  default: 10,
  min: 0,
}

/* ------------------------------------------------------------------ *
 * Brick / block wall
 * ------------------------------------------------------------------ */
const brickCalculator: CalculatorDef = {
  id: 'bricks',
  name: { en: 'Bricks & Blocks', ar: 'الطوب والبلوك' },
  description: {
    en: 'Estimate bricks/blocks, mortar cement and sand for a wall.',
    ar: 'تقدير الطوب والبلوك وأسمنت ورمل المونة للجدار.',
  },
  icon: 'wall',
  fields: [
    { key: 'length', label: { en: 'Wall length', ar: 'طول الجدار' }, unit: 'm', type: 'number', min: 0 },
    { key: 'height', label: { en: 'Wall height', ar: 'ارتفاع الجدار' }, unit: 'm', type: 'number', min: 0 },
    { key: 'openings', label: { en: 'Openings area (doors/windows)', ar: 'مساحة الفتحات' }, unit: 'm²', type: 'number', min: 0, default: 0 },
    {
      key: 'blockLength',
      label: { en: 'Block length', ar: 'طول البلوكة' },
      unit: 'mm',
      type: 'number',
      default: 400,
      min: 1,
    },
    {
      key: 'blockHeight',
      label: { en: 'Block height', ar: 'ارتفاع البلوكة' },
      unit: 'mm',
      type: 'number',
      default: 200,
      min: 1,
    },
    { key: 'mortar', label: { en: 'Mortar joint', ar: 'سماكة اللحام' }, unit: 'mm', type: 'number', default: 10, min: 0 },
    WASTE_FIELD,
  ],
  compute: (input) => {
    const grossArea = num(input, 'length') * num(input, 'height')
    const netArea = Math.max(grossArea - num(input, 'openings'), 0)
    const joint = num(input, 'mortar') / 1000
    const bl = num(input, 'blockLength', 400) / 1000 + joint
    const bh = num(input, 'blockHeight', 200) / 1000 + joint
    const perM2 = bl * bh > 0 ? 1 / (bl * bh) : 0
    const waste = num(input, 'waste', 10)
    const blocks = Math.ceil(netArea * perM2 * (1 + waste / 100))
    // rough mortar: ~0.03 m³ per m² of blockwork -> cement bags @ ~7 bags/m³, sand @ ~1 m³ per m³ mortar
    const mortarVol = netArea * 0.03
    const cementBags = Math.ceil(mortarVol * 7)
    const sandTonnes = round(mortarVol * 1.6, 2)
    return {
      lines: [
        { key: 'netArea', label: { en: 'Net wall area', ar: 'صافي مساحة الجدار' }, value: round(netArea, 2), unit: 'm²' },
        { key: 'blocks', label: { en: 'Blocks required', ar: 'عدد البلوك المطلوب' }, value: blocks, unit: 'pcs', suggests: 'blocks' },
        { key: 'cement', label: { en: 'Cement (mortar)', ar: 'أسمنت المونة' }, value: cementBags, unit: 'bags', suggests: 'cement' },
        { key: 'sand', label: { en: 'Sand', ar: 'رمل' }, value: sandTonnes, unit: 't', suggests: 'sand' },
      ],
      notes: [
        {
          en: 'Mortar and sand are approximate and depend on wall thickness and mix ratio.',
          ar: 'كميات المونة والرمل تقريبية وتعتمد على سماكة الجدار ونسبة الخلط.',
        },
      ],
    }
  },
}

/* ------------------------------------------------------------------ *
 * Concrete volume
 * ------------------------------------------------------------------ */
const concreteCalculator: CalculatorDef = {
  id: 'concrete',
  name: { en: 'Concrete Volume', ar: 'حجم الخرسانة' },
  description: {
    en: 'Volume of concrete plus cement, sand and aggregate for a slab or footing.',
    ar: 'حجم الخرسانة مع الأسمنت والرمل والحصى للبلاطة أو الأساس.',
  },
  icon: 'concrete',
  fields: [
    { key: 'length', label: { en: 'Length', ar: 'الطول' }, unit: 'm', type: 'number', min: 0 },
    { key: 'width', label: { en: 'Width', ar: 'العرض' }, unit: 'm', type: 'number', min: 0 },
    { key: 'thickness', label: { en: 'Thickness', ar: 'السماكة' }, unit: 'cm', type: 'number', min: 0, default: 15 },
    WASTE_FIELD,
  ],
  compute: (input) => {
    const vol = num(input, 'length') * num(input, 'width') * (num(input, 'thickness', 15) / 100)
    const waste = num(input, 'waste', 10)
    const volWaste = vol * (1 + waste / 100)
    // 1:2:4 mix approx per m³: 6.5 cement bags, 0.45 m³ sand, 0.9 m³ aggregate
    return {
      lines: [
        { key: 'volume', label: { en: 'Concrete volume', ar: 'حجم الخرسانة' }, value: round(volWaste, 3), unit: 'm³' },
        { key: 'cement', label: { en: 'Cement', ar: 'أسمنت' }, value: Math.ceil(volWaste * 6.5), unit: 'bags', suggests: 'cement' },
        { key: 'sand', label: { en: 'Sand', ar: 'رمل' }, value: round(volWaste * 0.45, 2), unit: 'm³', suggests: 'sand' },
        { key: 'aggregate', label: { en: 'Aggregate', ar: 'حصى' }, value: round(volWaste * 0.9, 2), unit: 'm³', suggests: 'aggregate' },
      ],
      notes: [{ en: 'Based on a 1:2:4 mix ratio.', ar: 'بناءً على نسبة خلط 1:2:4.' }],
    }
  },
}

/* ------------------------------------------------------------------ *
 * Tiles / flooring (coverage-based)
 * ------------------------------------------------------------------ */
const tilesCalculator: CalculatorDef = {
  id: 'tiles',
  name: { en: 'Tiles & Flooring', ar: 'البلاط والأرضيات' },
  description: {
    en: 'Boxes of tiles needed for a floor area, rounded to full boxes.',
    ar: 'عدد صناديق البلاط اللازمة للمساحة، مقربة لصناديق كاملة.',
  },
  icon: 'tiles',
  fields: [
    { key: 'area', label: { en: 'Floor area', ar: 'مساحة الأرضية' }, unit: 'm²', type: 'number', min: 0 },
    {
      key: 'boxCoverage',
      label: { en: 'Coverage per box', ar: 'التغطية لكل صندوق' },
      unit: 'm²',
      type: 'number',
      default: 1.44,
      min: 0.01,
    },
    WASTE_FIELD,
  ],
  compute: (input) => {
    const res = coverageToUnits(num(input, 'area'), num(input, 'boxCoverage', 1.44), num(input, 'waste', 10))
    return {
      lines: [
        { key: 'area', label: { en: 'Area with waste', ar: 'المساحة مع الهدر' }, value: res.demandWithWaste, unit: 'm²' },
        { key: 'boxes', label: { en: 'Boxes required', ar: 'الصناديق المطلوبة' }, value: res.unitsRequired, unit: 'boxes', suggests: 'tiles' },
        { key: 'surplus', label: { en: 'Surplus coverage', ar: 'الفائض' }, value: res.surplus, unit: 'm²' },
      ],
      notes: [{ en: 'Rounded up to full boxes.', ar: 'مقربة لأعلى لصناديق كاملة.' }],
    }
  },
}

/* ------------------------------------------------------------------ *
 * Paint coverage
 * ------------------------------------------------------------------ */
const paintCalculator: CalculatorDef = {
  id: 'paint',
  name: { en: 'Paint Coverage', ar: 'تغطية الدهان' },
  description: { en: 'Litres of paint for wall area and number of coats.', ar: 'لترات الدهان حسب المساحة وعدد الأوجه.' },
  icon: 'paint',
  fields: [
    { key: 'area', label: { en: 'Wall area', ar: 'مساحة الجدار' }, unit: 'm²', type: 'number', min: 0 },
    { key: 'coats', label: { en: 'Coats', ar: 'عدد الأوجه' }, type: 'number', default: 2, min: 1 },
    {
      key: 'spreadRate',
      label: { en: 'Spread rate (m²/L)', ar: 'معدل التغطية (م²/لتر)' },
      type: 'number',
      default: 10,
      min: 0.1,
    },
    WASTE_FIELD,
  ],
  compute: (input) => {
    const total = num(input, 'area') * num(input, 'coats', 2)
    const litres = coverageToUnits(total, num(input, 'spreadRate', 10), num(input, 'waste', 10))
    return {
      lines: [
        { key: 'litres', label: { en: 'Paint required', ar: 'الدهان المطلوب' }, value: litres.unitsRequired, unit: 'L', suggests: 'paint' },
      ],
      notes: [{ en: 'Includes all coats and waste.', ar: 'يشمل كل الأوجه والهدر.' }],
    }
  },
}

/* ------------------------------------------------------------------ *
 * Generic coverage calculator factory (gypsum, roofing, insulation, waterproofing)
 * ------------------------------------------------------------------ */
function coverageCalculator(
  id: string,
  name: { en: string; ar: string },
  description: { en: string; ar: string },
  icon: string,
  defaultCoverage: number,
  unitLabel: string,
  suggests: string,
): CalculatorDef {
  return {
    id,
    name,
    description,
    icon,
    fields: [
      { key: 'area', label: { en: 'Area to cover', ar: 'المساحة المطلوب تغطيتها' }, unit: 'm²', type: 'number', min: 0 },
      {
        key: 'coverage',
        label: { en: 'Coverage per unit', ar: 'التغطية لكل وحدة' },
        unit: 'm²',
        type: 'number',
        default: defaultCoverage,
        min: 0.01,
      },
      WASTE_FIELD,
    ],
    compute: (input) => {
      const res = coverageToUnits(num(input, 'area'), num(input, 'coverage', defaultCoverage), num(input, 'waste', 10))
      return {
        lines: [
          { key: 'units', label: name, value: res.unitsRequired, unit: unitLabel, suggests },
          { key: 'surplus', label: { en: 'Surplus', ar: 'الفائض' }, value: res.surplus, unit: 'm²' },
        ],
        notes: [{ en: 'Rounded up to whole units.', ar: 'مقربة لأعلى لوحدات كاملة.' }],
      }
    },
  }
}

/* ------------------------------------------------------------------ *
 * Fasteners (piece-based)
 * ------------------------------------------------------------------ */
const fastenersCalculator: CalculatorDef = {
  id: 'fasteners',
  name: { en: 'Screws, Nails & Fasteners', ar: 'البراغي والمسامير' },
  description: { en: 'Estimate fasteners by count of fixings and quantity per box.', ar: 'تقدير عدد المثبتات وعدد العلب.' },
  icon: 'fastener',
  fields: [
    { key: 'points', label: { en: 'Fixing points', ar: 'نقاط التثبيت' }, type: 'number', min: 0 },
    { key: 'perPoint', label: { en: 'Fasteners per point', ar: 'عدد المثبتات لكل نقطة' }, type: 'number', default: 4, min: 1 },
    { key: 'perBox', label: { en: 'Quantity per box', ar: 'العدد في العلبة' }, type: 'number', default: 100, min: 1 },
    WASTE_FIELD,
  ],
  compute: (input) => {
    const total = num(input, 'points') * num(input, 'perPoint', 4)
    const withWaste = total * (1 + num(input, 'waste', 10) / 100)
    const boxes = Math.ceil(withWaste / num(input, 'perBox', 100))
    return {
      lines: [
        { key: 'count', label: { en: 'Fasteners needed', ar: 'عدد المثبتات' }, value: Math.ceil(withWaste), unit: 'pcs' },
        { key: 'boxes', label: { en: 'Boxes', ar: 'العلب' }, value: boxes, unit: 'boxes', suggests: 'fasteners' },
      ],
      notes: [],
    }
  },
}

export const CALCULATORS: CalculatorDef[] = [
  brickCalculator,
  concreteCalculator,
  tilesCalculator,
  paintCalculator,
  coverageCalculator(
    'gypsum',
    { en: 'Gypsum Boards', ar: 'ألواح الجبس' },
    { en: 'Boards needed for a ceiling or partition area.', ar: 'عدد الألواح للسقف أو القاطع.' },
    'board',
    2.88,
    'boards',
    'gypsum',
  ),
  coverageCalculator(
    'roofing',
    { en: 'Roofing Panels', ar: 'ألواح الأسقف' },
    { en: 'Roofing panels for a roof area.', ar: 'ألواح الأسقف لمساحة السطح.' },
    'roof',
    2.4,
    'panels',
    'roofing',
  ),
  coverageCalculator(
    'insulation',
    { en: 'Insulation', ar: 'العزل' },
    { en: 'Insulation rolls/boards for an area.', ar: 'لفات/ألواح العزل للمساحة.' },
    'insulation',
    20,
    'rolls',
    'insulation',
  ),
  coverageCalculator(
    'waterproofing',
    { en: 'Waterproofing', ar: 'العزل المائي' },
    { en: 'Waterproofing membrane/coating for an area.', ar: 'أغشية/مواد العزل المائي للمساحة.' },
    'water',
    10,
    'units',
    'waterproofing',
  ),
  coverageCalculator(
    'plaster',
    { en: 'Plaster', ar: 'اللياسة' },
    { en: 'Plaster bags for a wall area.', ar: 'أكياس اللياسة لمساحة الجدار.' },
    'plaster',
    3,
    'bags',
    'plaster',
  ),
  coverageCalculator(
    'adhesive',
    { en: 'Tile Adhesive', ar: 'لاصق البلاط' },
    { en: 'Adhesive bags for a tiling area.', ar: 'أكياس اللاصق لمساحة التبليط.' },
    'adhesive',
    5,
    'bags',
    'adhesive',
  ),
  fastenersCalculator,
]

export function getCalculator(id: string): CalculatorDef | undefined {
  return CALCULATORS.find((c) => c.id === id)
}
