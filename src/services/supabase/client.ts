import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getOptionalEnv } from '../../utils/env';

let cachedClient: SupabaseClient | null = null;

function buildClient(): SupabaseClient | null {
  const supabaseUrl = getOptionalEnv('VITE_SUPABASE_URL');
  const supabaseAnonKey = getOptionalEnv('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!cachedClient) {
    cachedClient = buildClient();
  }
  return cachedClient;
}

export function requireSupabaseClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return client;
}
