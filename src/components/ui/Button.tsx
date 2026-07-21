import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-500 text-steel-900 hover:bg-brand-400',
  secondary: 'bg-steel-800 text-white hover:bg-steel-700',
  outline: 'border border-steel-300 text-steel-800 hover:bg-steel-100 bg-white',
  ghost: 'text-steel-700 hover:bg-steel-100',
  danger: 'bg-danger text-white hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-6 py-3',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  to?: string
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', to, className, children, ...rest }: Props) {
  const classes = cn(base, variants[variant], sizes[size], className)
  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
