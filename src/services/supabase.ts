/**
 * Supabase Client
 * Configurato con AsyncStorage per la persistenza della sessione.
 * Usa fetch con retry per resilienza a errori di rete transienti su mobile.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../constants/config';

const supabaseUrl = config.supabase.url || 'https://placeholder.supabase.co';
const supabaseAnonKey = config.supabase.anonKey || 'placeholder-anon-key';

// Check if Supabase is configured.
export const isSupabaseConfigured = !!(config.supabase.url && config.supabase.anonKey);

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

 //  Fetch function with retry logic.
async function fetchWithRetry(
  input: RequestInfo | string | URL,
  init?: RequestInit
): Promise<Response> {
  // convert input to string if it is a URL or Request.
  const requestInput = (input instanceof URL || typeof input === 'string') ? input.toString() : (input as RequestInfo);
  let lastError: unknown;
  // Retry up to MAX_RETRIES (3) times with exponential backoff.
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(requestInput as any, init);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        // Promise that creates an async pause/delay before the next attempt.
        await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

// Create the Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithRetry,
  },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
