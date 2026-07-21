import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/misc'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl font-black text-brand-500">404</p>
      <p className="mt-2 text-lg font-semibold text-steel-800">{t('common.noResults')}</p>
      <Button to="/" className="mt-6">{t('nav.home')}</Button>
    </div>
  )
}

export function TrackOrderPage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-4 text-2xl font-bold text-steel-900">{t('nav.trackOrder')}</h1>
      <Card className="p-6">
        <label className="block text-sm font-medium text-steel-700">{t('nav.trackOrder')}</label>
        <div className="mt-2 flex gap-2">
          <input placeholder="ORD-000000" className="w-full rounded-lg border border-steel-300 px-3 py-2" />
          <Button>{t('actions.search')}</Button>
        </div>
      </Card>
    </div>
  )
}

/**
 * Honest roadmap placeholder for later-stage features that are scaffolded but
 * not yet fully implemented — avoids fake buttons that pretend to work.
 */
export function StagePlaceholder({ titleKey, stage }: { titleKey: string; stage: string }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card className="p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{stage}</p>
        <h1 className="mt-2 text-2xl font-bold text-steel-900">{t(titleKey)}</h1>
        <p className="mt-3 text-steel-600">
          This module is part of the platform roadmap. The database schema, types and navigation
          are already in place — see <code className="rounded bg-steel-100 px-1">/docs/ROADMAP.md</code> for status.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button to="/shop">{t('nav.shop')}</Button>
          <Link to="/" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-steel-700 hover:bg-steel-100">{t('nav.home')}</Link>
        </div>
      </Card>
    </div>
  )
}
