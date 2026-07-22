import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useCart } from '@/context/CartContext'
import { CATEGORIES } from '@/data/categories'
import { useLocale } from '@/hooks/useLocale'
import { cn, t as tr } from '@/lib/utils'

const PRIMARY_NAV = [
  { key: 'home', to: '/' },
  { key: 'shop', to: '/shop' },
  { key: 'calculators', to: '/calculators' },
  { key: 'materialQuote', to: '/quote' },
  { key: 'findHandyman', to: '/handymen' },
  { key: 'trackOrder', to: '/track' },
]

export function Header() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { count } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-steel-200 bg-white/95 backdrop-blur">
      {/* Top utility bar */}
      <div className="bg-steel-900 text-steel-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <span>{t('brand.tagline')}</span>
          <div className="flex items-center gap-4">
            <Link to="/register/contractor" className="hover:text-white">{t('contractor.cta')}</Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button
          type="button"
          className="lg:hidden rounded-md p-2 hover:bg-steel-100"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className="block h-0.5 w-5 bg-steel-800" />
          <span className="mt-1 block h-0.5 w-5 bg-steel-800" />
          <span className="mt-1 block h-0.5 w-5 bg-steel-800" />
        </button>

        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-500 font-black text-steel-900">B</span>
          <span className="text-lg font-black tracking-tight text-steel-900">{t('brand.name')}</span>
        </Link>

        <form action={`${import.meta.env.BASE_URL}search`} className="hidden flex-1 md:block" role="search">
          <div className="flex overflow-hidden rounded-lg border border-steel-300">
            <input
              name="q"
              placeholder={t('hero.searchPlaceholder')}
              className="w-full px-4 py-2.5 text-sm outline-none"
            />
            <button type="submit" className="bg-brand-500 px-5 text-sm font-semibold text-steel-900 hover:bg-brand-400">
              {t('actions.search')}
            </button>
          </div>
        </form>

        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher />
          <Link to="/login" className="hidden rounded-lg px-3 py-1.5 text-sm font-semibold text-steel-700 hover:bg-steel-100 sm:inline-flex">
            {t('actions.signIn')}
          </Link>
          <Link to="/cart" className="relative rounded-lg bg-steel-900 px-4 py-2 text-sm font-semibold text-white hover:bg-steel-700">
            {t('cart.title')}
            {count > 0 && (
              <span className="absolute -top-2 -end-2 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-xs font-bold text-steel-900">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Category nav */}
      <nav className="hidden border-t border-steel-100 lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button className="flex items-center gap-1 px-3 py-2.5 text-sm font-semibold text-steel-800 hover:text-brand-600">
              {t('nav.categories')} ▾
            </button>
            {catOpen && (
              <div className="absolute start-0 top-full z-50 grid w-64 gap-1 rounded-lg border border-steel-200 bg-white p-2 shadow-lg">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    className="rounded-md px-3 py-2 text-sm text-steel-700 hover:bg-steel-100"
                  >
                    {tr(c.name, locale)}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {PRIMARY_NAV.slice(1).map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2.5 text-sm font-semibold hover:text-brand-600',
                  isActive ? 'text-brand-600' : 'text-steel-800',
                )
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-steel-100 bg-white lg:hidden">
          <div className="grid gap-0.5 p-2">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-semibold text-steel-800 hover:bg-steel-100"
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
            <div className="my-1 border-t border-steel-100" />
            {CATEGORIES.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.slug}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-steel-600 hover:bg-steel-100"
              >
                {tr(c.name, locale)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
