import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uwcskbqwdeuitflfenpd.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Ga9xq3EscJZYadHVWf5sgA_1YC09T_2'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})