import { createClient } from '@supabase/supabase-js'

let _supabase = null

export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

function getClient() {
  if (!_supabase) {
    const { url: supabaseUrl, key: supabaseAnonKey } =
      getSupabasePublicConfig()

    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  }
  return _supabase
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop]
  }
})

// Helper function to get the Supabase client
export const getSupabaseClient = () => {
  return getClient()
}

// Helper function to create a Supabase client with custom credentials
export const createSupabaseClient = (url, key) => {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}
