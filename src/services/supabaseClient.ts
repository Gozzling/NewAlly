import { createClient } from '@supabase/supabase-js'

const DEFAULT_URL = 'https://qcbcrrnzrzpjfmysiiri.supabase.co'
const DEFAULT_KEY = 'sb_publishable_C8m9z5Kn4QCQaN8Zvj11rw_AimKIuiu'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function hasSupabase(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
