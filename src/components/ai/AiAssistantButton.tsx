import { useTranslation } from 'react-i18next'

/**
 * Floating "Order with AI" launcher — opens the ChatGPT **app**, not the web
 * chat. If the app isn't installed it falls back to the relevant app store
 * (never the ChatGPT website).
 *
 * - Android: `intent://` deep link → app, else Play Store.
 * - iOS: `chatgpt://` scheme → app, else App Store after a short timeout.
 * - Desktop: attempt the desktop-app scheme via a hidden iframe (no web fallback).
 */
const APP_SCHEME = 'chatgpt://'
const ANDROID_PACKAGE = 'com.openai.chatgpt'
const IOS_STORE = 'https://apps.apple.com/app/chatgpt/id6448311069'
const ANDROID_STORE = 'https://play.google.com/store/apps/details?id=com.openai.chatgpt'

function openChatGptApp() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isAndroid = /Android/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)

  if (isAndroid) {
    window.location.href =
      `intent://open#Intent;scheme=chatgpt;package=${ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(ANDROID_STORE)};end`
    return
  }

  if (isIOS) {
    let opened = false
    const markOpened = () => {
      if (document.visibilityState === 'hidden') opened = true
    }
    document.addEventListener('visibilitychange', markOpened, { once: true })
    window.addEventListener('pagehide', () => { opened = true }, { once: true })
    // If the app didn't open (page still visible), send to the App Store.
    window.setTimeout(() => {
      if (!opened && document.visibilityState === 'visible') window.location.href = IOS_STORE
    }, 1500)
    window.location.href = APP_SCHEME
    return
  }

  // Desktop: try to open the ChatGPT desktop app without navigating away.
  try {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = APP_SCHEME
    document.body.appendChild(iframe)
    window.setTimeout(() => iframe.remove(), 2000)
  } catch {
    /* no-op: do not fall back to the web chat */
  }
}

export function AiAssistantButton() {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={openChatGptApp}
      className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 font-bold text-steel-900 shadow-lg transition-colors hover:bg-brand-400"
    >
      <span className="text-lg">🤖</span>
      <span className="hidden sm:inline">{t('ai.title')}</span>
    </button>
  )
}
