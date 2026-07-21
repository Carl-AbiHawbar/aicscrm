import { useTranslation } from 'react-i18next'
import type { Locale } from '@/types/domain'

/** Convenience hook exposing the active locale, direction and switcher. */
export function useLocale() {
  const { i18n } = useTranslation()
  const locale = (i18n.resolvedLanguage === 'ar' ? 'ar' : 'en') as Locale
  const dir: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr'
  const isRtl = dir === 'rtl'
  const setLocale = (next: Locale) => void i18n.changeLanguage(next)
  const toggle = () => setLocale(locale === 'ar' ? 'en' : 'ar')
  return { locale, dir, isRtl, setLocale, toggle }
}
