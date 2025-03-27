import { createClient } from '@supabase/supabase-js'

// Use environment variables or constants for your Supabase configuration
const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 