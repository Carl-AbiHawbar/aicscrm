import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Product, ProductVariant } from '@/types/domain'
import { useLocale } from '@/hooks/useLocale'
import { formatMoney, t as tr } from '@/lib/utils'
import { Badge } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'

/**
 * Table-style variant selector (spec §9): for products with many variants we
 * render a row per variant with its own price, stock and quantity — not just a
 * dropdown.
 */
export function VariantTable({ product }: { product: Product }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { addLine } = useCart()
  const [qty, setQty] = useState<Record<string, number>>({})

  const attributeKeys = useMemo(() => {
    const keys = new Set<string>()
    product.variants.forEach((v) => Object.keys(v.attributes).forEach((k) => keys.add(k)))
    return Array.from(keys)
  }, [product])

  const stockTone = (s: ProductVariant['stockStatus']) =>
    s === 'in_stock' ? 'success' : s === 'low_stock' ? 'warning' : s === 'backorder' ? 'info' : 'neutral'
  const stockLabel = (s: ProductVariant['stockStatus']) =>
    s === 'in_stock' ? t('product.inStock') : s === 'low_stock' ? t('product.lowStock') : s === 'backorder' ? t('product.backorder') : t('product.outOfStock')

  return (
    <div className="overflow-x-auto rounded-xl border border-steel-200">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-steel-100 text-start text-xs uppercase text-steel-500">
          <tr>
            {attributeKeys.map((k) => (
              <th key={k} className="px-3 py-2 text-start font-semibold">{k}</th>
            ))}
            <th className="px-3 py-2 text-start font-semibold">{t('product.sku')}</th>
            <th className="px-3 py-2 text-start font-semibold">{t('product.stock')}</th>
            <th className="px-3 py-2 text-start font-semibold">{t('product.price')}</th>
            <th className="px-3 py-2 text-start font-semibold">{t('product.quantity')}</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-steel-100">
          {product.variants.map((v) => {
            const price = v.promoPriceMinor ?? v.priceMinor
            const q = qty[v.id] ?? v.minQty
            const disabled = v.stockStatus === 'out_of_stock'
            return (
              <tr key={v.id} className="hover:bg-steel-50">
                {attributeKeys.map((k) => (
                  <td key={k} className="px-3 py-3 text-steel-800">{v.attributes[k] ? tr(v.attributes[k], locale) : '—'}</td>
                ))}
                <td className="px-3 py-3 font-mono text-xs text-steel-500">{v.sku}</td>
                <td className="px-3 py-3"><Badge tone={stockTone(v.stockStatus)}>{stockLabel(v.stockStatus)}</Badge></td>
                <td className="px-3 py-3">
                  {v.promoPriceMinor != null && (
                    <span className="me-1 text-xs text-steel-400 line-through">{formatMoney(v.priceMinor, locale)}</span>
                  )}
                  <span className="font-bold text-steel-900">{formatMoney(price, locale)}</span>
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min={v.minQty}
                    step={v.qtyIncrement}
                    value={q}
                    disabled={disabled}
                    onChange={(e) => setQty((s) => ({ ...s, [v.id]: Math.max(v.minQty, Number(e.target.value)) }))}
                    className="w-20 rounded-md border border-steel-300 px-2 py-1.5 disabled:bg-steel-100"
                  />
                </td>
                <td className="px-3 py-3">
                  <Button size="sm" disabled={disabled} onClick={() => addLine(product, v, q)}>
                    {t('actions.addToCart')}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
