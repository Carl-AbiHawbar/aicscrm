import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getProduct } from '@/lib/catalog'
import { CATEGORIES, BRANDS } from '@/data/categories'
import { VariantTable } from '@/components/product/VariantTable'
import { Badge, Card, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { UNIT_LABELS } from '@/engine/units'
import { useLocale } from '@/hooks/useLocale'
import { formatMoney, formatNumber, t as tr } from '@/lib/utils'
import type { Product } from '@/types/domain'

export function ProductPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { slug } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    void getProduct(slug ?? '').then((p) => {
      setProduct(p)
      setLoading(false)
    })
  }, [slug])

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8"><Skeleton className="h-96" /></div>
  if (!product) return <div className="mx-auto max-w-7xl px-4 py-16"><EmptyState title={t('common.noResults')} action={<Button to="/shop">{t('nav.shop')}</Button>} /></div>

  const category = CATEGORIES.find((c) => c.id === product.categoryId)
  const brand = BRANDS.find((b) => b.id === product.brandId)
  const unit = UNIT_LABELS[product.unitOfSale]
  const from = Math.min(...product.variants.map((v) => v.promoPriceMinor ?? v.priceMinor))

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-steel-500">
        <Link to="/" className="hover:text-brand-600">{t('nav.home')}</Link>
        <span>/</span>
        {category && <><Link to={`/category/${category.slug}`} className="hover:text-brand-600">{tr(category.name, locale)}</Link><span>/</span></>}
        <span className="text-steel-800">{tr(product.name, locale)}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="aspect-square overflow-hidden rounded-2xl bg-steel-100">
          <div className="grid h-full w-full place-items-center text-8xl text-steel-300">🧱</div>
        </div>

        {/* Summary */}
        <div>
          {brand && <p className="text-sm font-semibold text-brand-600">{tr(brand.name, locale)}</p>}
          <h1 className="mt-1 text-2xl font-bold text-steel-900 lg:text-3xl">{tr(product.name, locale)}</h1>
          <p className="mt-1 text-sm text-steel-400">{product.sku}</p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-sm text-steel-500">{t('common.from')}</span>
            <span className="text-3xl font-black text-steel-900">{formatMoney(from, locale)}</span>
            <span className="text-sm text-steel-500">/ {tr(unit, locale)}</span>
          </div>

          <p className="mt-4 text-steel-600">{tr(product.description, locale)}</p>

          {product.coveragePerUnit && (
            <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-steel-700">
              📐 {t('product.coverage')}: {formatNumber(product.coveragePerUnit, locale)} m² / {tr(unit, locale)}
            </p>
          )}

          {/* Materials + installation actions (spec §12/§26) */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary">{t('product.buyMaterialOnly')}</Button>
            {product.installable && (
              <>
                <Button variant="secondary" to="/handymen">{t('product.buyWithInstallation')}</Button>
                <Button variant="outline" to="/handymen">{t('product.requestSiteVisit')}</Button>
              </>
            )}
            <Button variant="outline" to="/quote">{t('product.requestQuote')}</Button>
          </div>
        </div>
      </div>

      {/* Variant table */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold text-steel-900">{t('product.variants')}</h2>
        <VariantTable product={product} />
      </section>

      {/* Specifications */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold text-steel-900">{t('product.specifications')}</h2>
          <dl className="divide-y divide-steel-100 text-sm">
            <SpecRow label={t('product.unit')} value={tr(unit, locale)} />
            <SpecRow label={t('product.weight')} value={`${formatNumber(product.variants[0].handling.unitWeightKg, locale)} kg`} />
            <SpecRow
              label={t('product.dimensions')}
              value={`${product.variants[0].handling.packagedLengthCm}×${product.variants[0].handling.packagedWidthCm}×${product.variants[0].handling.packagedHeightCm} cm`}
            />
            <SpecRow label={t('product.stock')} value={<Badge tone="success">{t('product.inStock')}</Badge>} />
          </dl>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold text-steel-900">{t('sections.delivery')}</h2>
          <ul className="space-y-2 text-sm text-steel-600">
            {product.variants[0].handling.forkliftRequired && <li>🚜 {t('delivery.vehicle')}: forklift required</li>}
            {product.variants[0].handling.craneRequired && <li>🏗️ crane required</li>}
            {product.variants[0].handling.coveredVehicleRequired && <li>📦 covered vehicle required</li>}
            {product.variants[0].handling.oversized && <li>📏 oversized item</li>}
          </ul>
          <p className="mt-2 text-sm text-steel-500">{t('delivery.explainer')}</p>
        </Card>
      </section>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <dt className="text-steel-500">{label}</dt>
      <dd className="font-semibold text-steel-800">{value}</dd>
    </div>
  )
}
