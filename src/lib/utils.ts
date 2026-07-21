import { clsx, type ClassValue } from 'clsx'
import type { Bilingual, Locale } from '@/types/domain'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

/** Pick the localized string, falling back to the other language if missing. */
export function t(value: Bilingual | undefined, locale: Locale): string {
  if (!value) return ''
  return value[locale] || value[locale === 'ar' ? 'en' : 'ar'] || ''
}

/** Format an amount stored in minor units (e.g. halalas/cents) as currency. */
export function formatMoney(minor: number, locale: Locale, currency = 'SAR'): string {
  const amount = minor / 100
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(value)
}
