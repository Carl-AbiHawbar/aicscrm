import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { AiAssistantButton } from '@/components/ai/AiAssistantButton'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AiAssistantButton />
    </div>
  )
}
