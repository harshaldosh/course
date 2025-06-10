import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Provide fallback values for development
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using placeholder values for development.');
}

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey
);