import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Check if we're in the browser environment
const isBrowser = typeof window !== 'undefined'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for the browser
const supabase = isBrowser 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'soi-pos-session',
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : ({} as ReturnType<typeof createClient<Database>>)

export { supabase }