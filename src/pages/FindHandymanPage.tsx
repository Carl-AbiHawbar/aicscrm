import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SERVICE_CATEGORIES, PROFESSIONALS } from '@/data/services'
import { Badge, Card, SectionHeading } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'
import { formatMoney, t as tr } from '@/lib/utils'

export function FindHandymanPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { slug } = useParams()
  const activeCat = SERVICE_CATEGORIES.find((c) => c.slug === slug)
  const pros = activeCat ? PROFESSIONALS.filter((p) => p.serviceCategoryIds.includes(activeCat.id)) : PROFESSIONALS

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <SectionHeading title={t('nav.findHandyman')} action={<Button to="/handymen/request">{t('product.requestQuote')}</Button>} />

      <div className="mb-6 flex flex-wrap gap-2">
        <a href="/handymen" className={`rounded-full border px-3 py-1.5 text-sm ${!activeCat ? 'border-brand-500 bg-brand-50 font-semibold' : 'border-steel-300'}`}>{t('actions.viewAll')}</a>
        {SERVICE_CATEGORIES.map((c) => (
          <a key={c.id} href={`/handymen/${c.slug}`} className={`rounded-full border px-3 py-1.5 text-sm ${activeCat?.id === c.id ? 'border-brand-500 bg-brand-50 font-semibold' : 'border-steel-300'}`}>
            {tr(c.name, locale)}
          </a>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pros.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-steel-100 text-2xl">👷</div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-steel-900">{tr(p.name, locale)}</p>
                  {p.verified && <Badge tone="success">✓</Badge>}
                </div>
                <p className="text-sm text-steel-500">{p.businessName}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {p.serviceCategoryIds.map((id) => {
                const sc = SERVICE_CATEGORIES.find((s) => s.id === id)
                return sc ? <Badge key={id} tone="brand">{tr(sc.name, locale)}</Badge> : null
              })}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-steel-400">★</dt><dd className="font-semibold">{p.rating} ({p.reviewCount})</dd></div>
              <div><dt className="text-steel-400">{t('sections.professionals')}</dt><dd className="font-semibold">{p.completedJobs}</dd></div>
              <div className="col-span-2"><dt className="text-steel-400 text-xs">{t('common.from')}</dt><dd className="font-bold text-steel-900">{formatMoney(p.startingPriceMinor, locale)}</dd></div>
            </dl>
            <Button variant="outline" className="mt-4 w-full" to="/handymen/request">{t('product.requestQuote')}</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
