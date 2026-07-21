import { isSupabaseConfigured } from './supabase'
import { PRODUCTS, findProductBySlug } from '@/data/products'
import { CATEGORIES, type Category } from '@/data/categories'
import type { Product } from '@/types/domain'

/**
 * Catalogue access layer. Currently backed by bundled seed data so the app is
 * runnable without a backend. When Supabase is configured, these functions are
 * the single place to swap in queries (products, product_variants, categories)
 * with pagination + server-side filtering — the rest of the app is unaffected.
 */

export interface ProductQuery {
  categorySlug?: string
  search?: string
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popularity'
  page?: number
  pageSize?: number
}

export interface ProductPage {
  items: Product[]
  total: number
  page: number
  pageSize: number
}

function lowestPrice(p: Product): number {
  return Math.min(...p.variants.map((v) => v.promoPriceMinor ?? v.priceMinor))
}

export async function listProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const { categorySlug, search, sort, page = 1, pageSize = 12 } = query

  if (isSupabaseConfigured) {
    // TODO: replace with paginated Supabase query using RPC/search index.
  }

  let items = [...PRODUCTS]
  if (categorySlug) {
    const cat = CATEGORIES.find((c) => c.slug === categorySlug)
    if (cat) items = items.filter((p) => p.categoryId === cat.id)
  }
  if (search) {
    const q = search.trim().toLowerCase()
    items = items.filter((p) => {
      const hay = [
        p.name.en,
        p.name.ar,
        p.sku,
        p.description.en,
        p.description.ar,
        ...p.variants.map((v) => v.sku),
        ...p.variants.flatMap((v) => [v.name.en, v.name.ar, v.barcode ?? '']),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }
  switch (sort) {
    case 'price_asc':
      items.sort((a, b) => lowestPrice(a) - lowestPrice(b))
      break
    case 'price_desc':
      items.sort((a, b) => lowestPrice(b) - lowestPrice(a))
      break
    default:
      break
  }

  const total = items.length
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total, page, pageSize }
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured) {
    // TODO: fetch product + variants + images + documents from Supabase.
  }
  return findProductBySlug(slug) ?? null
}

export function listCategories(): Category[] {
  return CATEGORIES
}
