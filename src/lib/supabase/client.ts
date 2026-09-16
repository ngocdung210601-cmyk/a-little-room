import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Only ever instantiated with the public anon key — never the service-role
 * key, which must stay server-side. Row Level Security (see supabase/schema.sql)
 * is what keeps this safe to ship to the browser.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    })
  : null

export const STORAGE_BUCKET = 'chat-images'

/**
 * Ensures the browser has a real (anonymous) Supabase auth session and
 * returns its user id. This id is what `session_id` columns store, which is
 * what lets RLS policies check `auth.uid() = session_id` instead of trusting
 * a client-supplied string. Requires Anonymous Sign-Ins to be enabled in
 * Supabase Auth settings.
 */
export async function getSupabaseSessionId(): Promise<string> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data } = await client.auth.getSession()
  if (data.session?.user) return data.session.user.id
  const { data: signInData, error } = await client.auth.signInAnonymously()
  if (error || !signInData.user) throw error ?? new Error('Could not start an anonymous session')
  return signInData.user.id
}
