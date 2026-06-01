import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in server contexts:
 * - Server Components
 * - API Routes (Route Handlers)
 * - Server Actions
 *
 * Uses cookie-based session management via @supabase/ssr.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from a Server Component — cookies can't be
            // modified from Server Components. Middleware handles this.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with SERVICE ROLE key.
 * Bypasses ALL RLS — use only in trusted server-side contexts (API routes, server actions).
 * IMPORTANT: Uses plain @supabase/supabase-js so the service role key is effective.
 * Never expose this client or key to the browser.
 */
export async function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

