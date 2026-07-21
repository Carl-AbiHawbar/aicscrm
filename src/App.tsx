import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { CartProvider } from '@/context/CartContext'
import { HomePage } from '@/pages/HomePage'
import { ProductListPage } from '@/pages/ProductListPage'
import { ProductPage } from '@/pages/ProductPage'
import { CartPage } from '@/pages/CartPage'
import { CalculatorsPage } from '@/pages/CalculatorsPage'
import { CalculatorPage } from '@/pages/CalculatorPage'
import { FindHandymanPage } from '@/pages/FindHandymanPage'
import { AuthPage } from '@/pages/AuthPage'
import { NotFoundPage, StagePlaceholder, TrackOrderPage } from '@/pages/misc/SimplePages'

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ProductListPage mode="shop" />} />
            <Route path="category/:slug" element={<ProductListPage mode="category" />} />
            <Route path="search" element={<ProductListPage mode="search" />} />
            <Route path="product/:slug" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="calculators" element={<CalculatorsPage />} />
            <Route path="calculators/:id" element={<CalculatorPage />} />
            <Route path="handymen" element={<FindHandymanPage />} />
            <Route path="handymen/:slug" element={<FindHandymanPage />} />
            <Route path="track" element={<TrackOrderPage />} />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="register" element={<AuthPage mode="register" />} />

            {/* Scaffolded, roadmap-tracked modules (see /docs/ROADMAP.md) */}
            <Route path="checkout" element={<StagePlaceholder titleKey="cart.checkout" stage="Stage 2 — Commerce" />} />
            <Route path="quote" element={<StagePlaceholder titleKey="nav.materialQuote" stage="Stage 3 — Quotations" />} />
            <Route path="handymen/request" element={<StagePlaceholder titleKey="nav.findHandyman" stage="Stage 5 — Handyman" />} />
            <Route path="register/contractor" element={<StagePlaceholder titleKey="contractor.cta" stage="Stage 1 — Foundation" />} />
            <Route path="projects" element={<StagePlaceholder titleKey="nav.projects" stage="Stage 3 — Projects" />} />
            <Route path="help" element={<StagePlaceholder titleKey="nav.help" stage="Content" />} />
            <Route path="admin/*" element={<StagePlaceholder titleKey="nav.categories" stage="Stage 6 — Admin" />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}
