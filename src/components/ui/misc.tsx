import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-steel-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  )
}

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'
const tones: Record<BadgeTone, string> = {
  neutral: 'bg-steel-100 text-steel-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  brand: 'bg-brand-100 text-brand-800',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-steel-300 bg-white px-6 py-16 text-center">
      <p className="text-lg font-semibold text-steel-800">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-steel-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="text-xl font-bold text-steel-900 sm:text-2xl">{title}</h2>
      {action}
    </div>
  )
}
