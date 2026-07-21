import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartLine, Product, ProductVariant } from '@/types/domain'

interface CartContextValue {
  lines: CartLine[]
  addLine: (product: Product, variant: ProductVariant, quantity: number) => void
  updateQty: (variantId: string, quantity: number) => void
  removeLine: (variantId: string) => void
  clear: () => void
  count: number
  subtotalMinor: number
  taxMinor: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'binaamart.cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartLine[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])

  const addLine: CartContextValue['addLine'] = (product, variant, quantity) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variant.id === variant.id)
      if (existing) {
        return prev.map((l) =>
          l.variant.id === variant.id ? { ...l, quantity: l.quantity + quantity } : l,
        )
      }
      const line: CartLine = {
        variant,
        product: {
          id: product.id,
          name: product.name,
          unitOfSale: product.unitOfSale,
          coveragePerUnit: product.coveragePerUnit,
          coverageUnit: product.coverageUnit,
        },
        quantity,
      }
      return [...prev, line]
    })
  }

  const updateQty: CartContextValue['updateQty'] = (variantId, quantity) => {
    setLines((prev) =>
      prev
        .map((l) => (l.variant.id === variantId ? { ...l, quantity: Math.max(quantity, 0) } : l))
        .filter((l) => l.quantity > 0),
    )
  }

  const removeLine = (variantId: string) =>
    setLines((prev) => prev.filter((l) => l.variant.id !== variantId))

  const clear = () => setLines([])

  const value = useMemo<CartContextValue>(() => {
    const subtotalMinor = lines.reduce((sum, l) => {
      const price = l.variant.promoPriceMinor ?? l.variant.priceMinor
      return sum + price * l.quantity
    }, 0)
    const taxMinor = lines.reduce((sum, l) => {
      const price = l.variant.promoPriceMinor ?? l.variant.priceMinor
      return sum + Math.round((price * l.quantity * l.variant.taxRatePct) / 100)
    }, 0)
    const count = lines.reduce((sum, l) => sum + l.quantity, 0)
    return { lines, addLine, updateQty, removeLine, clear, count, subtotalMinor, taxMinor }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
