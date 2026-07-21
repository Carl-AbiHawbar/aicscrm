import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CALCULATORS } from '@/engine/calculators'
import { SectionHeading } from '@/components/ui/misc'
import { useLocale } from '@/hooks/useLocale'
import { t as tr } from '@/lib/utils'

export function CalculatorsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <SectionHeading title={t('calc.title')} />
      <p className="mb-6 max-w-2xl text-steel-600">{t('calc.subtitle')}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CALCULATORS.map((c) => (
          <Link key={c.id} to={`/calculators/${c.id}`} className="rounded-xl border border-steel-200 bg-white p-5 hover:border-brand-400 hover:shadow-sm">
            <p className="text-3xl">📐</p>
            <h3 className="mt-2 font-bold text-steel-900">{tr(c.name, locale)}</h3>
            <p className="mt-1 text-sm text-steel-500">{tr(c.description, locale)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
