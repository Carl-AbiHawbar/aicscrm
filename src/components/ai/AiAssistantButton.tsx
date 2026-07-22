import { useTranslation } from 'react-i18next'

/**
 * Floating "Order with AI" launcher.
 *
 * Uses ChatGPT's **universal / app link** (https://chatgpt.com). When the
 * ChatGPT app is installed, iOS/Android intercept a direct tap on this link and
 * open the app; otherwise it opens the site. Opens a fresh chat with no
 * pre-filled prompt.
 *
 * IMPORTANT: this must be a plain <a> tapped directly — no target="_blank" and
 * no JavaScript window.location/window.open. Those make the OS bypass the
 * universal link and open the browser (or the app store) instead.
 */
const CHATGPT_URL = 'https://chatgpt.com/'

export function AiAssistantButton() {
  const { t } = useTranslation()

  return (
    <a
      href={CHATGPT_URL}
      className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 font-bold text-steel-900 shadow-lg transition-colors hover:bg-brand-400"
    >
      <span className="text-lg">🤖</span>
      <span className="hidden sm:inline">{t('ai.title')}</span>
    </a>
  )
}
