import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/context/CartContext'
import { estimateDelivery } from '@/lib/logistics'
import { Button } from '@/components/ui/Button'
import { Badge, Card, EmptyState } from '@/components/ui/misc'
import { UNIT_LABELS } from '@/engine/units'
import { useLocale } from '@/hooks/useLocale'
import { formatMoney, formatNumber, t as tr } from '@/lib/utils'

const WARNING_LABELS: Record<string, { en: string; ar: string }> = {
  oversized_item: { en: 'Oversized item in order', ar: 'يوجد عنصر كبير الحجم' },
  crane_required: { en: 'Crane required for delivery', ar: 'مطلوب رافعة للتوصيل' },
  forklift_required: { en: 'Forklift required', ar: 'مطلوب رافعة شوكية' },
  hazardous_restricted: { en: 'Restricted / hazardous item', ar: 'عنصر مقيّد أو خطِر' },
  fragile_handling: { en: 'Fragile — careful handling', ar: 'قابل للكسر — مناولة بحذر' },
  multiple_vehicles_required: { en: 'Multiple vehicles required', ar: 'مطلوب أكثر من مركبة' },
  delivery_quotation_required: { en: 'Delivery quotation required', ar: 'مطلوب عرض سعر للتوصيل' },
}

export function CartPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { lines, updateQty, removeLine, subtotalMinor, taxMinor } = useCart()

  const { match, price } = useMemo(() => estimateDelivery(lines), [lines])

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title={t('cart.empty')} action={<Button to="/shop">{t('cart.continueShopping')}</Button>} />
      </div>
    )
  }

  const deliveryMinor = price.totalMinor ?? 0
  const totalMinor = subtotalMinor + taxMinor + deliveryMinor

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-steel-900">{t('cart.title')}</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lines */}
        <div className="space-y-3 lg:col-span-2">
          {lines.map((l) => {
            const priceMinor = l.variant.promoPriceMinor ?? l.variant.priceMinor
            const unit = UNIT_LABELS[l.product.unitOfSale]
            return (
              <Card key={l.variant.id} className="flex gap-4 p-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-steel-100 text-3xl">🧱</div>
                <div className="flex-1">
                  <p className="font-semibold text-steel-900">{tr(l.product.name, locale)}</p>
                  <p className="text-sm text-steel-500">{tr(l.variant.name, locale)}</p>
                  <p className="text-xs text-steel-400">{l.variant.sku} · {tr(unit, locale)}</p>
                  <p className="mt-1 text-xs text-steel-500">
                    {t('product.weight')}: {formatNumber(l.variant.handling.unitWeightKg * l.quantity, locale)} kg
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="number"
                      min={l.variant.minQty}
                      step={l.variant.qtyIncrement}
                      value={l.quantity}
                      onChange={(e) => updateQty(l.variant.id, Number(e.target.value))}
                      className="w-20 rounded-md border border-steel-300 px-2 py-1.5"
                    />
                    <button onClick={() => removeLine(l.variant.id)} className="text-sm text-danger hover:underline">
                      {t('cart.remove')}
                    </button>
                  </div>
                </div>
                <div className="text-end">
                  <p className="font-bold text-steel-900">{formatMoney(priceMinor * l.quantity, locale)}</p>
                  <p className="text-xs text-steel-400">{formatMoney(priceMinor, locale)} {t('common.each')}</p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Summary + delivery engine */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 font-bold text-steel-900">{t('sections.delivery')}</h2>
            <dl className="space-y-1.5 text-sm">
              <Row label={t('delivery.totalWeight')} value={`${formatNumber(match.metrics.totalWeightKg, locale)} kg`} />
              <Row label={t('delivery.totalVolume')} value={`${formatNumber(Math.round(match.metrics.totalVolumeCm3 / 1_000_000 * 100) / 100, locale)} m³`} />
              <Row label={t('delivery.longestItem')} value={`${formatNumber(match.metrics.longestItemCm, locale)} cm`} />
              <Row label={t('delivery.pallets')} value={formatNumber(match.metrics.palletCount, locale)} />
              <div className="border-t border-steel-100 pt-2">
                {match.status === 'matched' && match.vehicle ? (
                  <Row label={t('delivery.vehicle')} value={<span className="font-semibold">{tr(match.vehicle.name, locale)}</span>} />
                ) : match.status === 'multi_vehicle' ? (
                  <Row label={t('delivery.vehicle')} value={<Badge tone="warning">{tr(WARNING_LABELS.multiple_vehicles_required, locale)} ×{match.vehicles.length}</Badge>} />
                ) : (
                  <Row label={t('delivery.vehicle')} value={<Badge tone="info">{t('delivery.quotationRequired')}</Badge>} />
                )}
              </div>
            </dl>

            {match.warnings.length > 0 && (
              <ul className="mt-3 space-y-1">
                {match.warnings.map((w) => (
                  <li key={w} className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">⚠ {tr(WARNING_LABELS[w] ?? { en: w, ar: w }, locale)}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <dl className="space-y-2 text-sm">
              <Row label={t('cart.subtotal')} value={formatMoney(subtotalMinor, locale)} />
              <Row label={t('cart.tax')} value={formatMoney(taxMinor, locale)} />
              <Row
                label={t('cart.deliveryEstimate')}
                value={price.requiresManualQuote ? <Badge tone="info">{t('delivery.quotationRequired')}</Badge> : formatMoney(deliveryMinor, locale)}
              />
              <div className="border-t border-steel-200 pt-2">
                <Row label={<span className="text-base font-bold">{t('cart.total')}</span>} value={<span className="text-base font-bold">{formatMoney(totalMinor, locale)}</span>} />
              </div>
            </dl>
            <Button className="mt-4 w-full" size="lg" to="/checkout">{t('cart.checkout')}</Button>
            <p className="mt-2 text-center text-xs text-steel-400">{t('delivery.explainer').slice(0, 90)}…</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-steel-500">{label}</dt>
      <dd className="text-steel-800">{value}</dd>
    </div>
  )
}
