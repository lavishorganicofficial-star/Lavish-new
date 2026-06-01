import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Checks if the incoming request is from an authenticated admin.
 * Uses cookie-based createClient() for auth verification (session-aware),
 * and returns the service-role createAdminClient() for DB writes (RLS bypassed).
 *
 * Returns { userClient, adminDb } if admin, or null if unauthorized.
 */
export async function requireAdminDb(request: NextRequest) {
  // Verify identity via cookie session
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user) return null;

  // Check admin role via app_metadata (fastest)
  const userRole = (user.app_metadata as { user_role?: string })?.user_role;
  if (userRole === 'admin') {
    const adminDb = await createAdminClient();
    return { user, adminDb };
  }

  // Fallback: check profiles table
  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role === 'admin') {
    const adminDb = await createAdminClient();
    return { user, adminDb };
  }

  return null;
}

export function forbiddenResponse() {
  return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
}
