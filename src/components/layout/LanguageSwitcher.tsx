import { useTranslation } from 'react-i18next'
import { useLocale } from '@/hooks/useLocale'

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const { toggle } = useLocale()
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border border-steel-300 bg-white px-3 py-1.5 text-sm font-semibold text-steel-700 hover:bg-steel-100"
      aria-label="Switch language"
    >
      {t('lang.switch')}
    </button>
  )
}
