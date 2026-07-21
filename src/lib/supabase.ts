import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client. Credentials come exclusively from environment variables
 * (never hard-coded). When the project is not yet configured, `supabase` is
 * null and the data layer falls back to bundled seed data so the app remains
 * runnable during early development.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
