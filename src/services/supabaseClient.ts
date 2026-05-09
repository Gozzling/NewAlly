import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (import.meta.env.DEV && SUPABASE_URL) {
  try {
    console.info('[Supabase] URL configured (host only):', new URL(SUPABASE_URL).host)
  } catch {
    /* invalid URL in dev env */
  }
}

export const supabase: SupabaseClient | null = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export function hasSupabase(): boolean {
  return supabase !== null
}