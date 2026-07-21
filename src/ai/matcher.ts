import { PRODUCTS } from '@/data/products'
import type { Product, ProductVariant } from '@/types/domain'

/**
 * Lightweight, deterministic product matcher for the AI ordering assistant.
 *
 * IMPORTANT: This is the client-side *preview* matcher. In production the
 * natural-language understanding (voice transcription, LLM extraction) runs in
 * a secure backend edge function with the same controlled catalogue tools; the
 * assistant is never given raw DB write access, and prices/stock/delivery are
 * always recalculated server-side before confirmation. This module intentionally
 * NEVER invents specifications — unmatched or ambiguous requests are flagged for
 * clarification rather than guessed.
 */

export type Confidence = 'confirmed' | 'likely' | 'clarify' | 'none'

export interface ExtractedRequest {
  raw: string
  quantity: number
  unitHint: string | null
  keywords: string[]
}

export interface ProductMatch {
  request: ExtractedRequest
  product: Product | null
  variant: ProductVariant | null
  alternatives: { product: Product; variant: ProductVariant }[]
  confidence: Confidence
  clarification: { en: string; ar: string } | null
}

/** Controlled synonym map — maps customer/trade terms to product ids. */
const SYNONYMS: { productId: string; terms: string[] }[] = [
  { productId: 'p-cement', terms: ['cement', 'اسمنت', 'أسمنت', 'opc', 'portland'] },
  { productId: 'p-block', terms: ['block', 'blocks', 'بلوك', 'hollow block', 'concrete block'] },
  { productId: 'p-tile-porcelain', terms: ['tile', 'tiles', 'بلاط', 'porcelain', 'بورسلان', 'flooring tile'] },
  { productId: 'p-paint-emulsion', terms: ['paint', 'دهان', 'بويه', 'emulsion', 'ايمولشن'] },
  { productId: 'p-pvc-pipe', terms: ['pipe', 'pipes', 'انبوب', 'أنبوب', 'ماسورة', 'pvc'] },
  { productId: 'p-nails', terms: ['nail', 'nails', 'مسمار', 'مسامير'] },
  { productId: 'p-gypsum', terms: ['gypsum', 'جبس', 'board', 'gypsum board', 'لوح جبس'] },
  { productId: 'p-cable', terms: ['cable', 'wire', 'كابل', 'سلك', 'electrical cable'] },
  { productId: 'p-drill', terms: ['drill', 'دريل', 'مثقاب', 'hammer drill'] },
  { productId: 'p-door', terms: ['door', 'باب', 'wooden door', 'أبواب'] },
  { productId: 'p-rebar', terms: ['rebar', 'reinforcement', 'steel rod', 'حديد', 'حديد تسليح', 'قضيب حديد', 'steel bar'] },
  { productId: 'p-adhesive', terms: ['adhesive', 'لاصق', 'tile adhesive', 'غراء'] },
]

const UNIT_WORDS = ['bag', 'bags', 'box', 'boxes', 'piece', 'pieces', 'pcs', 'roll', 'rolls', 'sheet', 'sheets', 'pallet', 'set', 'sets', 'm', 'metre', 'meter', 'كيس', 'أكياس', 'صندوق', 'قطعة', 'قطع', 'لفة', 'لوح', 'متر']

const ARABIC_DIGITS: Record<string, string> = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' }

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => ARABIC_DIGITS[d] ?? d)
    .replace(/[أإآ]/g, 'ا')
    .trim()
}

/** Split a free-text order into candidate line requests. */
export function extractRequests(text: string): ExtractedRequest[] {
  const parts = text
    .split(/[\n,]|(?:\band\b)|(?:\bو )/gi)
    .map((p) => p.trim())
    .filter(Boolean)

  return parts.map((raw) => {
    const norm = normalize(raw)
    const qtyMatch = norm.match(/(\d+(?:\.\d+)?)/)
    const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1
    const unitHint = UNIT_WORDS.find((u) => new RegExp(`(^|\\s)${u}(\\s|$)`).test(norm)) ?? null
    const keywords = norm
      .replace(/\d+(?:\.\d+)?/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !UNIT_WORDS.includes(w))
    return { raw, quantity, unitHint, keywords }
  })
}

function scoreProduct(req: ExtractedRequest, productId: string): number {
  const entry = SYNONYMS.find((s) => s.productId === productId)
  if (!entry) return 0
  const hay = req.keywords.join(' ')
  let score = 0
  for (const term of entry.terms) {
    const nt = normalize(term)
    if (hay.includes(nt) || req.keywords.includes(nt)) score += nt.includes(' ') ? 2 : 1
  }
  return score
}

export function matchRequest(req: ExtractedRequest): ProductMatch {
  const scored = PRODUCTS.map((p) => ({ product: p, score: scoreProduct(req, p.id) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return {
      request: req,
      product: null,
      variant: null,
      alternatives: [],
      confidence: 'none',
      clarification: { en: 'We could not find a matching product. Can you describe it differently?', ar: 'لم نتمكن من إيجاد منتج مطابق. هل يمكنك وصفه بطريقة أخرى؟' },
    }
  }

  const best = scored[0].product

  // pick a variant: if multiple, try to match attribute keywords; else clarify
  const variantMatches = best.variants.filter((v) =>
    req.keywords.some((kw) =>
      Object.values(v.attributes).some((a) => normalize(a.en).includes(kw) || normalize(a.ar).includes(kw)) ||
      normalize(v.name.en).includes(kw) || normalize(v.name.ar).includes(kw),
    ),
  )

  let variant: ProductVariant | null = null
  let confidence: Confidence
  let clarification: ProductMatch['clarification'] = null

  if (best.variants.length === 1) {
    variant = best.variants[0]
    confidence = scored.length === 1 || scored[0].score - (scored[1]?.score ?? 0) >= 2 ? 'confirmed' : 'likely'
  } else if (variantMatches.length === 1) {
    variant = variantMatches[0]
    confidence = 'likely'
  } else {
    // several variants — must ask which one
    confidence = 'clarify'
    const opts = best.variants.map((v) => v.name.en).slice(0, 3).join(', ')
    const optsAr = best.variants.map((v) => v.name.ar).slice(0, 3).join('، ')
    clarification = {
      en: `Which option of ${best.name.en} do you need? e.g. ${opts}`,
      ar: `أي خيار من ${best.name.ar} تحتاج؟ مثل ${optsAr}`,
    }
  }

  return {
    request: req,
    product: best,
    variant,
    alternatives: scored.slice(1, 4).map((s) => ({ product: s.product, variant: s.product.variants[0] })),
    confidence,
    clarification,
  }
}

export function matchOrderText(text: string): ProductMatch[] {
  return extractRequests(text).map(matchRequest)
}
