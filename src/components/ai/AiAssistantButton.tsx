import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { matchOrderText, type ProductMatch, type Confidence } from '@/ai/matcher'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/hooks/useLocale'
import { formatMoney, t as tr } from '@/lib/utils'
import { Badge } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'

const CONF_TONE: Record<Confidence, 'success' | 'warning' | 'info' | 'danger'> = {
  confirmed: 'success',
  likely: 'info',
  clarify: 'warning',
  none: 'danger',
}
const CONF_LABEL: Record<Confidence, { en: string; ar: string }> = {
  confirmed: { en: 'Confirmed match', ar: 'مطابقة مؤكدة' },
  likely: { en: 'Likely match', ar: 'مطابقة محتملة' },
  clarify: { en: 'Clarification required', ar: 'يلزم توضيح' },
  none: { en: 'No reliable match', ar: 'لا توجد مطابقة موثوقة' },
}

export function AiAssistantButton() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { addLine } = useCart()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [matches, setMatches] = useState<ProductMatch[] | null>(null)
  const [chosenVariant, setChosenVariant] = useState<Record<number, string>>({})
  const [added, setAdded] = useState(false)

  const analyze = () => {
    if (!text.trim()) return
    setMatches(matchOrderText(text))
    setAdded(false)
  }

  const readyToConfirm = matches?.some((m) => m.product) ?? false

  const confirmDraftCart = () => {
    if (!matches) return
    matches.forEach((m, i) => {
      if (!m.product) return
      const variant = m.product.variants.find((v) => v.id === chosenVariant[i]) ?? m.variant
      if (variant) addLine(m.product, variant, Math.max(1, Math.round(m.request.quantity)))
    })
    setAdded(true)
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 font-bold text-steel-900 shadow-lg hover:bg-brand-400"
      >
        <span className="text-lg">🤖</span>
        <span className="hidden sm:inline">{t('actions.orderWithAi')}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setOpen(false)}>
          <div
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-steel-200 bg-steel-900 px-4 py-3 text-white">
              <div>
                <p className="font-bold">{t('actions.orderWithAi')}</p>
                <p className="text-xs text-steel-400">{t('actions.sendYourList')}</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-steel-700">✕</button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="rounded-lg bg-steel-100 p-3 text-sm text-steel-700">
                {locale === 'ar'
                  ? 'أخبرنا بما تحتاجه، مثال: "20 كيس أسمنت، 500 بلوك، 10 أنابيب PVC".'
                  : 'Tell us what you need, e.g. "20 bags of cement, 500 blocks, 10 PVC pipes".'}
              </div>

              {matches && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-steel-400">
                    {added ? tr({ en: 'Draft cart', ar: 'سلة مبدئية' }, locale) : tr({ en: 'Draft request', ar: 'طلب مبدئي' }, locale)}
                  </p>
                  {matches.map((m, i) => (
                    <div key={i} className="rounded-lg border border-steel-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-steel-600">"{m.request.raw}"</p>
                        <Badge tone={CONF_TONE[m.confidence]}>{tr(CONF_LABEL[m.confidence], locale)}</Badge>
                      </div>

                      {m.product && (
                        <div className="mt-2">
                          <p className="font-semibold text-steel-900">{tr(m.product.name, locale)}</p>
                          {m.product.variants.length > 1 ? (
                            <select
                              value={chosenVariant[i] ?? m.variant?.id ?? ''}
                              onChange={(e) => setChosenVariant((s) => ({ ...s, [i]: e.target.value }))}
                              className="mt-1 w-full rounded-md border border-steel-300 px-2 py-1.5 text-sm"
                            >
                              <option value="" disabled>{t('product.variants')}</option>
                              {m.product.variants.map((v) => (
                                <option key={v.id} value={v.id}>{tr(v.name, locale)} — {formatMoney(v.promoPriceMinor ?? v.priceMinor, locale)}</option>
                              ))}
                            </select>
                          ) : m.variant ? (
                            <p className="text-sm text-steel-500">{tr(m.variant.name, locale)} — {formatMoney(m.variant.promoPriceMinor ?? m.variant.priceMinor, locale)}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-steel-500">{t('product.quantity')}: {Math.round(m.request.quantity)}</p>
                        </div>
                      )}

                      {m.clarification && (
                        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">❓ {tr(m.clarification, locale)}</p>
                      )}
                    </div>
                  ))}

                  {/* Escalation hint */}
                  {matches.some((m) => m.confidence === 'none') && (
                    <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                      {locale === 'ar' ? 'يمكنك التحدث مع فريق الدعم لإكمال الطلب.' : 'You can speak to a support agent to complete this order.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-steel-200 p-3">
              {!added ? (
                <>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    placeholder={t('hero.searchPlaceholder')}
                    className="w-full resize-none rounded-lg border border-steel-300 px-3 py-2 text-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button className="flex-1" onClick={analyze}>{t('actions.sendYourList')}</Button>
                    {readyToConfirm && (
                      <Button variant="secondary" className="flex-1" onClick={confirmDraftCart}>{t('actions.confirm')}</Button>
                    )}
                  </div>
                  <p className="mt-2 text-center text-[11px] text-steel-400">
                    {locale === 'ar'
                      ? 'لن يتم إنشاء أي طلب دون تأكيدك الصريح للمنتجات والعنوان والإجمالي.'
                      : 'No order is created without your explicit confirmation of products, address and total.'}
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                    {locale === 'ar' ? 'أُضيفت العناصر المؤكدة إلى سلتك.' : 'Confirmed items added to your cart.'}
                  </p>
                  <Button className="w-full" to="/cart" >{t('cart.title')}</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
