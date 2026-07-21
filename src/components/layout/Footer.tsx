import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()
  const links: { label: string; to: string }[] = [
    { label: t('nav.shop'), to: '/shop' },
    { label: t('nav.calculators'), to: '/calculators' },
    { label: t('nav.findHandyman'), to: '/handymen' },
    { label: t('nav.trackOrder'), to: '/track' },
    { label: t('nav.help'), to: '/help' },
  ]
  return (
    <footer className="mt-16 border-t border-steel-200 bg-steel-900 text-steel-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-500 font-black text-steel-900">B</span>
            <span className="text-lg font-black text-white">{t('brand.name')}</span>
          </div>
          <p className="mt-3 text-sm text-steel-400">{t('brand.tagline')}</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold text-white">{t('nav.shop')}</h3>
          <ul className="space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold text-white">{t('sections.trust')}</h3>
          <ul className="space-y-2 text-sm">
            <li>{t('trust.securePayment')}</li>
            <li>{t('trust.cod')}</li>
            <li>{t('trust.verifiedPros')}</li>
            <li>{t('trust.scheduledDelivery')}</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold text-white">{t('contractor.title')}</h3>
          <p className="text-sm text-steel-400">{t('contractor.body')}</p>
          <Link to="/register/contractor" className="mt-3 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-steel-900 hover:bg-brand-400">
            {t('contractor.cta')}
          </Link>
        </div>
      </div>
      <div className="border-t border-steel-800 py-4 text-center text-xs text-steel-500">
        © {new Date().getFullYear()} {t('brand.name')}
      </div>
    </footer>
  )
}
