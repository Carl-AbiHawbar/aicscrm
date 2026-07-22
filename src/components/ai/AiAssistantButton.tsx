import { useTranslation } from 'react-i18next'
import type { MouseEvent } from 'react'

/**
 * Floating "Order with AI" launcher — opens the ChatGPT **app** on mobile,
 * with no pre-filled prompt (a fresh chat).
 *
 * - iOS / desktop: the plain <a href> is a ChatGPT universal link. iOS
 *   intercepts a direct tap and opens the app when installed. It MUST stay a
 *   real anchor (no target="_blank", no JS navigation) or iOS opens the browser.
 * - Android: intercept the tap and fire an `intent://` that targets the ChatGPT
 *   app package, falling back to the site only if the app isn't installed.
 */
const CHATGPT_URL = 'https://chatgpt.com/'
const ANDROID_PACKAGE = 'com.openai.chatgpt'

function handleClick(e: MouseEvent<HTMLAnchorElement>) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  if (/Android/i.test(ua)) {
    e.preventDefault()
    window.location.href =
      `intent://chatgpt.com/#Intent;scheme=https;package=${ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(CHATGPT_URL)};end`
  }
  // iOS + desktop: let the universal link (anchor default) handle it.
}

export function AiAssistantButton() {
  const { t } = useTranslation()

  return (
    <a
      href={CHATGPT_URL}
      onClick={handleClick}
      className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 font-bold text-steel-900 shadow-lg transition-colors hover:bg-brand-400"
    >
      <span className="text-lg">🤖</span>
      <span className="hidden sm:inline">{t('ai.title')}</span>
    </a>
  )
}
