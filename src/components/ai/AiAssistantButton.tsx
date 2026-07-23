import { useTranslation } from 'react-i18next'
import type { MouseEvent } from 'react'

/**
 * Floating "Order with AI" launcher — opens the ChatGPT **app** on mobile.
 *
 * The ChatGPT app registers the URL scheme `chatgpt://` (host required, e.g.
 * `chatgpt://chatgpt.com/`) and supports universal links for chatgpt.com.
 *
 * - iOS: navigate to the `chatgpt://chatgpt.com/` scheme; if the app doesn't
 *   take over, fall back to the universal link.
 * - Android: `intent://` targeting the ChatGPT app package, else the site.
 * - Desktop: plain link to the web app.
 */
const CHATGPT_URL = 'https://chatgpt.com/'
const IOS_APP_URL = 'chatgpt://chatgpt.com/'
const ANDROID_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.openai.chatgpt'

function handleClick(e: MouseEvent<HTMLAnchorElement>) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isAndroid = /Android/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
    // iPadOS reports as Mac; detect touch to catch it
    (/Macintosh/i.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)

  if (isAndroid) {
    e.preventDefault()
    // Open the ChatGPT Play Store listing (opens the Play Store app, where the
    // "Open" button launches ChatGPT if installed, or installs it otherwise).
    window.location.href = ANDROID_PLAY_URL
    return
  }

  if (isIOS) {
    e.preventDefault()
    // Cancel the web fallback if the app takes over (page becomes hidden).
    const fallback = window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.href = CHATGPT_URL
    }, 1500)
    document.addEventListener(
      'visibilitychange',
      () => { if (document.visibilityState === 'hidden') window.clearTimeout(fallback) },
      { once: true },
    )
    window.location.href = IOS_APP_URL
    return
  }

  // Desktop: let the anchor open the web app.
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
