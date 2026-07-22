import { useTranslation } from 'react-i18next'
import { useLocale } from '@/hooks/useLocale'

/**
 * Floating "Order with AI" launcher. Tries to open the ChatGPT **mobile app**
 * (or desktop app) via its deep-link scheme, falling back to the website only
 * if the app isn't installed.
 *
 * - Android: `intent://` URL with a `browser_fallback_url`.
 * - iOS / desktop: attempt the `chatgpt://` scheme, then fall back to the web
 *   URL after a short timeout if the page is still visible (i.e. no app opened).
 */
const CHATGPT_WEB = 'https://chatgpt.com/'
const APP_SCHEME = 'chatgpt://'
const ANDROID_PACKAGE = 'com.openai.chatgpt'

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

function openChatGpt(prompt: string) {
  const webUrl = `${CHATGPT_WEB}?q=${encodeURIComponent(prompt)}`
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isAndroid = /Android/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)

  if (isAndroid) {
    // Android intent: open the app, or fall back to the site if not installed.
    window.location.href =
      `intent://new#Intent;scheme=chatgpt;package=${ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`
    return
  }

  // iOS + desktop: try the app scheme, fall back to the web if nothing opened.
  const fallback = window.setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.open(webUrl, '_blank', 'noopener,noreferrer')
    }
  }, 1200)

  const onHide = () => {
    if (document.visibilityState === 'hidden') window.clearTimeout(fallback)
  }
  document.addEventListener('visibilitychange', onHide, { once: true })

  if (isIOS) {
    // iOS opens custom schemes reliably via location assignment.
    window.location.href = APP_SCHEME
  } else {
    // Desktop: use a hidden iframe so a missing scheme doesn't navigate away.
    try {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = APP_SCHEME
      document.body.appendChild(iframe)
      window.setTimeout(() => iframe.remove(), 1500)
    } catch {
      window.open(webUrl, '_blank', 'noopener,noreferrer')
    }
  }
}

export function AiAssistantButton() {
  const { t } = useTranslation()
  const { locale } = useLocale()

  return (
    <button
      type="button"
      onClick={() => openChatGpt(PROMPTS[locale])}
      className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 font-bold text-steel-900 shadow-lg transition-colors hover:bg-brand-400"
    >
      <span className="text-lg">🤖</span>
      <span className="hidden sm:inline">{t('ai.title')}</span>
    </button>
  )
}
