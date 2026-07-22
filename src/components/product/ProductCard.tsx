import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Product } from '@/types/domain'
import { useLocale } from '@/hooks/useLocale'
import { formatMoney, t as tr } from '@/lib/utils'
import { UNIT_LABELS } from '@/engine/units'
import { Badge } from '@/components/ui/misc'
import { AppImage } from '@/components/ui/AppImage'

export function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const prices = product.variants.map((v) => v.promoPriceMinor ?? v.priceMinor)
  const from = Math.min(...prices)
  const hasPromo = product.variants.some((v) => v.promoPriceMinor != null)
  const anyStock = product.variants.some((v) => v.stockStatus !== 'out_of_stock')
  const unit = UNIT_LABELS[product.unitOfSale]

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-steel-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-steel-100">
        <AppImage src={product.imageUrl} alt={tr(product.name, locale)} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute start-2 top-2 flex gap-1">
          {hasPromo && <Badge tone="danger">%</Badge>}
          {!anyStock && <Badge tone="neutral">{t('product.outOfStock')}</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-steel-400">{product.sku}</p>
        <h3 className="line-clamp-2 text-sm font-semibold text-steel-900 group-hover:text-brand-600">
          {tr(product.name, locale)}
        </h3>
        <div className="mt-auto pt-2">
          <p className="text-xs text-steel-400">
            {t('common.from')} · {tr(unit, locale)}
          </p>
          <p className="text-lg font-bold text-steel-900">{formatMoney(from, locale)}</p>
          {product.variants.length > 1 && (
            <p className="text-xs text-steel-500">{product.variants.length} {t('product.variants')}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
