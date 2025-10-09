import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create singleton instance to avoid multiple client warnings
let supabaseInstance = null;

function createSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        // Use sessionStorage to avoid conflicts in development
        storage: window?.sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      // Suppress multiple instance warnings in development
      global: {
        headers: {
          'X-Client-Info': 'rkive-app'
        }
      },
      // Disable realtime completely to prevent connection errors
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      db: {
        schema: 'public'
      }
    });
    
    // Add some debugging info
    if (import.meta.env.DEV) {
      console.log('✅ Supabase client initialized');
    }
  }
  
  return supabaseInstance;
}

export const supabase = createSupabaseClient();
