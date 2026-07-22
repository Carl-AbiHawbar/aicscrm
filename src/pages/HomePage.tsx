import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/misc'
import { AppImage } from '@/components/ui/AppImage'
import { ProductCard } from '@/components/product/ProductCard'
import { CATEGORIES } from '@/data/categories'
import { SERVICE_CATEGORIES, PROFESSIONALS } from '@/data/services'
import { CALCULATORS } from '@/engine/calculators'
import { listProducts } from '@/lib/catalog'
import { useLocale } from '@/hooks/useLocale'
import { asset, t as tr } from '@/lib/utils'
import type { Product } from '@/types/domain'

const PROJECT_KEYS = [
  'buildWall', 'renovateBathroom', 'paintHome', 'installFlooring',
  'repairPlumbing', 'upgradeElectrical', 'waterproofRoof', 'buildOutdoor',
]

export function HomePage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [featured, setFeatured] = useState<Product[]>([])

  useEffect(() => {
    void listProducts({ pageSize: 8 }).then((r) => setFeatured(r.items))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-steel-900 text-white">
        <img
          src={asset('images/hero-warehouse.jpg')}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-steel-900 via-steel-900/80 to-steel-900/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-24">
          <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-steel-300">{t('hero.subtitle')}</p>

          <form action={`${import.meta.env.BASE_URL}search`} className="mt-8 max-w-2xl" role="search">
            <div className="flex overflow-hidden rounded-xl bg-white">
              <input name="q" placeholder={t('hero.searchPlaceholder')} className="w-full px-5 py-4 text-steel-900 outline-none" />
              <button className="bg-brand-500 px-6 font-bold text-steel-900 hover:bg-brand-400">{t('actions.search')}</button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button to="/shop" size="lg">{t('actions.shopProducts')}</Button>
            <Button to="/calculators" size="lg" variant="outline" className="!text-white !border-white/30 !bg-white/10 hover:!bg-white/20">
              {t('actions.calculateMaterials')}
            </Button>
            <Button to="/handymen" size="lg" variant="outline" className="!text-white !border-white/30 !bg-white/10 hover:!bg-white/20">
              {t('actions.findHandyman')}
            </Button>
            <Button to="/quote" size="lg" variant="outline" className="!text-white !border-white/30 !bg-white/10 hover:!bg-white/20">
              {t('actions.requestQuote')}
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Categories */}
        <section className="mb-12">
          <SectionHeading title={t('sections.mainCategories')} action={<Link to="/shop" className="text-sm font-semibold text-brand-600">{t('actions.viewAll')}</Link>} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <Link key={c.id} to={`/category/${c.slug}`} className="group overflow-hidden rounded-xl border border-steel-200 bg-white text-center hover:border-brand-400 hover:shadow-sm">
                <AppImage src={c.image} alt={tr(c.name, locale)} className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-105" />
                <span className="block p-3 text-sm font-semibold text-steel-800">{tr(c.name, locale)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Shop by project */}
        <section className="mb-12">
          <SectionHeading title={t('sections.shopByProject')} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROJECT_KEYS.map((k) => (
              <div key={k} className="rounded-xl bg-steel-100 p-5">
                <p className="font-semibold text-steel-800">{t(`projects.${k}`)}</p>
                <Link to="/calculators" className="mt-2 inline-block text-sm font-semibold text-brand-600">{t('actions.calculateMaterials')} →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* Calculators */}
        <section className="mb-12">
          <SectionHeading title={t('sections.calculators')} action={<Link to="/calculators" className="text-sm font-semibold text-brand-600">{t('actions.viewAll')}</Link>} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CALCULATORS.slice(0, 6).map((c) => (
              <Link key={c.id} to={`/calculators/${c.id}`} className="rounded-xl border border-steel-200 bg-white p-4 hover:border-brand-400">
                <p className="text-2xl">📐</p>
                <p className="mt-2 text-sm font-semibold text-steel-800">{tr(c.name, locale)}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured products */}
        <section className="mb-12">
          <SectionHeading title={t('sections.featured')} action={<Link to="/shop" className="text-sm font-semibold text-brand-600">{t('actions.viewAll')}</Link>} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Delivery explainer */}
        <section className="mb-12 rounded-2xl bg-steel-900 p-8 text-white">
          <SectionHeading title={t('sections.delivery')} />
          <p className="max-w-3xl text-steel-300">{t('delivery.explainer')}</p>
        </section>

        {/* Professionals */}
        <section className="mb-12">
          <SectionHeading title={t('sections.professionals')} action={<Link to="/handymen" className="text-sm font-semibold text-brand-600">{t('actions.viewAll')}</Link>} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SERVICE_CATEGORIES.slice(0, 10).map((s) => (
              <Link key={s.id} to={`/handymen/${s.slug}`} className="rounded-xl border border-steel-200 bg-white p-4 text-center hover:border-brand-400">
                <p className="text-2xl">🛠️</p>
                <p className="mt-2 text-sm font-semibold text-steel-800">{tr(s.name, locale)}</p>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-steel-500">
            {PROFESSIONALS.filter((p) => p.verified).length} {t('trust.verifiedPros')}
          </p>
        </section>

        {/* Contractor CTA */}
        <section className="rounded-2xl border border-brand-200 bg-brand-50 p-8">
          <h2 className="text-2xl font-bold text-steel-900">{t('contractor.title')}</h2>
          <p className="mt-2 max-w-2xl text-steel-600">{t('contractor.body')}</p>
          <Button to="/register/contractor" size="lg" className="mt-4">{t('contractor.cta')}</Button>
        </section>
      </div>
    </div>
  )
}
