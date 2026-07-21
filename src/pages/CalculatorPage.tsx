import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCalculator, type CalculatorResult } from '@/engine/calculators'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui/misc'
import { useLocale } from '@/hooks/useLocale'
import { formatNumber, t as tr } from '@/lib/utils'

export function CalculatorPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { id } = useParams()
  const calc = useMemo(() => getCalculator(id ?? ''), [id])

  const [input, setInput] = useState<Record<string, number | string>>(() => {
    const init: Record<string, number | string> = {}
    calc?.fields.forEach((f) => { init[f.key] = f.default ?? '' })
    return init
  })
  const [result, setResult] = useState<CalculatorResult | null>(null)

  if (!calc) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title={t('common.noResults')} action={<Button to="/calculators">{t('calc.title')}</Button>} /></div>
  }

  const run = () => setResult(calc.compute(input))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav className="mb-4 text-sm text-steel-500">
        <Link to="/calculators" className="hover:text-brand-600">{t('calc.title')}</Link> / <span className="text-steel-800">{tr(calc.name, locale)}</span>
      </nav>
      <h1 className="text-2xl font-bold text-steel-900">{tr(calc.name, locale)}</h1>
      <p className="mt-1 text-steel-600">{tr(calc.description, locale)}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <div className="space-y-4">
            {calc.fields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-sm font-medium text-steel-700">
                  {tr(f.label, locale)} {f.unit && <span className="text-steel-400">({f.unit})</span>}
                </span>
                <input
                  type="number"
                  value={input[f.key] ?? ''}
                  min={f.min}
                  onChange={(e) => setInput((s) => ({ ...s, [f.key]: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full rounded-lg border border-steel-300 px-3 py-2"
                />
              </label>
            ))}
            <Button className="w-full" onClick={run}>{t('actions.calculate')}</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-bold text-steel-900">{t('calc.result')}</h2>
          {!result ? (
            <p className="text-sm text-steel-400">{t('calc.subtitle')}</p>
          ) : (
            <>
              <ul className="divide-y divide-steel-100">
                {result.lines.map((line) => (
                  <li key={line.key} className="flex items-center justify-between py-2">
                    <span className="text-sm text-steel-600">{tr(line.label, locale)}</span>
                    <span className="font-bold text-steel-900">{formatNumber(line.value, locale)} {line.unit}</span>
                  </li>
                ))}
              </ul>
              {result.notes.map((n, i) => (
                <p key={i} className="mt-2 text-xs text-steel-400">ℹ {tr(n, locale)}</p>
              ))}
              <p className="mt-2 text-xs text-steel-400">{t('calc.estimateNote')}</p>
              <Button variant="secondary" className="mt-4 w-full" to="/shop">{t('actions.addResultToCart')}</Button>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
