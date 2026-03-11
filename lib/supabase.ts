import { createBrowserClient } from '@supabase/ssr';

// Fallback strings prevent build-time throws during static analysis.
// Real values are injected at runtime via env vars.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL    ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
);
