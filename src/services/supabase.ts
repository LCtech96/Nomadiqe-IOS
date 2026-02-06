/**
 * Supabase Client
 * Configurato con AsyncStorage per la persistenza della sessione
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../constants/config';

const supabaseUrl = config.supabase.url || 'https://placeholder.supabase.co';
const supabaseAnonKey = config.supabase.anonKey || 'placeholder-anon-key';

export const isSupabaseConfigured = !!(config.supabase.url && config.supabase.anonKey);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
