import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Guard: createClient throws if URL or key is empty.
// Return a safe no-op proxy so the app still renders without Supabase.
function createSafeClient(): SupabaseClient {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY – database features disabled.');
  // Return a minimal stub that won't crash callers using .from().select() etc.
  const noop = () => ({ data: null, error: { message: 'Supabase not configured' } });
  const chainable: any = new Proxy({}, {
    get: () => (..._args: any[]) => {
      // Every chained method returns the same chainable, except terminal ones which resolve.
      const terminal = new Proxy({}, {
        get: (_t, prop) => {
          if (prop === 'then') return undefined; // make it non-thenable so `await` resolves it
          return (..._a: any[]) => terminal;
        },
      });
      // When awaited, resolve with { data: null, error }
      return Object.assign(terminal, { then: (res: any) => res(noop()) });
    },
  });
  return { from: () => chainable, auth: chainable, storage: chainable, rpc: (..._args: any[]) => Promise.resolve(noop()) } as unknown as SupabaseClient;
}

export const supabase = createSafeClient();

