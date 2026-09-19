import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isDemo = !url || url === 'https://SEU_PROJETO.supabase.co'

export const supabase = isDemo
  ? (null as unknown as ReturnType<typeof createClient>)
  : createClient(url, key)
