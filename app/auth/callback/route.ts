import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /auth/callback
 * Handles OAuth redirect (Google) and email confirmation magic links.
 * Exchanges the code for a session, then redirects to the intended page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') ?? '/account';
  const next = redirectTo.startsWith('/') ? redirectTo : '/account';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[Auth Callback] Exchange error:', error);
  }

  // On error, redirect to login with an error message
  return NextResponse.redirect(
    `${origin}/login?error=Authentication+failed.+Please+try+again.`
  );
}
