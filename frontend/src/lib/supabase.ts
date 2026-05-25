import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : null;

/** Full URL where Supabase sends users after Google/email OAuth (must match Supabase Redirect URLs). */
export function getAuthRedirectUrl() {
  const configured = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/$/, '');
  const origin =
    configured ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  if (!origin) {
    return '/auth/callback';
  }

  // Must be absolute — missing https:// in Supabase Site URL causes redirects to supabase.co/your-domain
  if (!/^https?:\/\//i.test(origin)) {
    return `https://${origin}/auth/callback`;
  }

  return `${origin}/auth/callback`;
}
