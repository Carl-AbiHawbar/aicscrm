import { useTranslation } from 'react-i18next'
import { useLocale } from '@/hooks/useLocale'

/**
 * Floating "Order with AI" launcher.
 *
 * Uses ChatGPT's **universal / app link** (https://chatgpt.com). When the
 * ChatGPT app is installed, iOS/Android intercept a direct tap on this link and
 * open the app; otherwise it opens the site.
 *
 * IMPORTANT: this must be a plain <a> tapped directly — no target="_blank" and
 * no JavaScript window.location/window.open. Those make the OS bypass the
 * universal link and open the browser (or the app store) instead.
 */
const CHATGPT_URL = 'https://chatgpt.com/'

const PROMPTS = {
  en:
    "Hi! I'd like to order construction and building materials from BinaaMart " +
    '(cement, blocks, tiles, paint, pipes, tools, etc.). Please help me build my ' +
    'order step by step: ask what I need, the quantities and units, and my ' +
    'delivery site, then summarise the order for my confirmation.',
  ar:
    'مرحباً! أرغب بطلب مواد بناء من بناء مارت (أسمنت، بلوك، بلاط، دهانات، أنابيب، ' +
    'عدد...). ساعدني في تجهيز طلبي خطوة بخطوة: اسألني عمّا أحتاجه والكميات والوحدات ' +
    'وموقع التوصيل، ثم لخّص الطلب لتأكيدي.',
}

export function AiAssistantButton() {
  const { t } = useTranslation()
  const { locale } = useLocale()

  const href = `${CHATGPT_URL}?q=${encodeURIComponent(PROMPTS[locale])}`

  return (
    <a
      href={href}
      className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 font-bold text-steel-900 shadow-lg transition-colors hover:bg-brand-400"
    >
      <span className="text-lg">🤖</span>
      <span className="hidden sm:inline">{t('ai.title')}</span>
    </a>
  )
}
