import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import ar from './locales/ar.json'

export const SUPPORTED_LOCALES = ['en', 'ar'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LOCALES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'binaamart.lang',
      caches: ['localStorage'],
    },
  })

/** Keep <html lang/dir> in sync with the active language for RTL support. */
function applyDir(lng: string) {
  const dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('lang', lng)
  document.documentElement.setAttribute('dir', dir)
}

applyDir(i18n.resolvedLanguage ?? 'en')
i18n.on('languageChanged', applyDir)

export default i18n
