import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/misc'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!isSupabaseConfigured || !supabase) {
      setMsg('Authentication requires Supabase configuration (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
      return
    }
    setLoading(true)
    const fn = mode === 'login' ? supabase.auth.signInWithPassword({ email, password }) : supabase.auth.signUp({ email, password })
    const { error } = await fn
    setLoading(false)
    setMsg(error ? error.message : mode === 'login' ? 'Signed in.' : 'Check your email to confirm.')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card className="p-8">
        <h1 className="mb-6 text-2xl font-bold text-steel-900">
          {mode === 'login' ? t('actions.signIn') : t('actions.register')}
        </h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-steel-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-steel-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-steel-700">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-steel-300 px-3 py-2" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : mode === 'login' ? t('actions.signIn') : t('actions.register')}
          </Button>
        </form>
        {msg && <p className="mt-4 rounded-lg bg-steel-100 px-3 py-2 text-sm text-steel-700">{msg}</p>}
        <p className="mt-4 text-center text-sm text-steel-500">
          <a href={mode === 'login' ? '/register' : '/login'} className="font-semibold text-brand-600">
            {mode === 'login' ? t('actions.register') : t('actions.signIn')}
          </a>
        </p>
      </Card>
    </div>
  )
}
