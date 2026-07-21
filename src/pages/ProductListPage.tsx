import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listProducts, type ProductQuery } from '@/lib/catalog'
import { CATEGORIES } from '@/data/categories'
import { ProductCard } from '@/components/product/ProductCard'
import { EmptyState, SectionHeading, Skeleton } from '@/components/ui/misc'
import { useLocale } from '@/hooks/useLocale'
import { t as tr } from '@/lib/utils'
import type { Product } from '@/types/domain'

type Mode = 'shop' | 'category' | 'search'

export function ProductListPage({ mode }: { mode: Mode }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? undefined

  const [items, setItems] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ProductQuery['sort']>('popularity')
  const [loading, setLoading] = useState(true)

  const category = useMemo(() => CATEGORIES.find((c) => c.slug === slug), [slug])

  const title = mode === 'category' && category ? tr(category.name, locale) : mode === 'search' ? `${t('actions.search')}: ${q ?? ''}` : t('nav.shop')

  useEffect(() => {
    setLoading(true)
    void listProducts({
      categorySlug: mode === 'category' ? slug : undefined,
      search: mode === 'search' ? q : undefined,
      sort,
      page,
      pageSize: 12,
    }).then((r) => {
      setItems(r.items)
      setTotal(r.total)
      setLoading(false)
    })
  }, [mode, slug, q, sort, page])

  const pageCount = Math.max(1, Math.ceil(total / 12))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <SectionHeading
        title={title}
        action={
          <select
            value={sort}
            onChange={(e) => { setPage(1); setSort(e.target.value as ProductQuery['sort']) }}
            className="rounded-lg border border-steel-300 px-3 py-2 text-sm"
          >
            <option value="popularity">{t('sections.featured')}</option>
            <option value="price_asc">↑ {t('product.price')}</option>
            <option value="price_desc">↓ {t('product.price')}</option>
          </select>
        }
      />
      <p className="mb-4 text-sm text-steel-500">{total} {t('nav.shop')}</p>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={t('common.noResults')} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {pageCount > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-9 w-9 rounded-lg text-sm font-semibold ${page === i + 1 ? 'bg-brand-500 text-steel-900' : 'border border-steel-300 bg-white'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
