/**
 * middleware.ts
 * Next.js middleware for route protection and session management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Define route categories
const ADMIN_PATTERNS = [/^\/admin(?!\/login)/];
const ACCOUNT_PATTERNS = [/^\/account/];
const INFLUENCER_DASHBOARD_PATTERNS = [/^\/influencer\/dashboard/];
const INFLUENCER_LOGIN_PATTERN = /^\/influencer\/login/;
const CUSTOMER_LOGIN_PATTERN = /^\/login/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Helper to redirect
  const redirect = (path: string) => {
    const url = new URL(path, request.url);
    if (path === '/login' || path === '/influencer/login') {
      url.searchParams.set('redirectTo', pathname);
    }
    return NextResponse.redirect(url);
  };

  // Get true role from profiles if user exists
  let role = 'user';
  let isInfluencerSystemUser = false;
  
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data?.role) role = data.role;
    
    if (role === 'influencer' || role === 'admin') {
      isInfluencerSystemUser = true;
    } else {
      const { data: inf } = await supabase.from('influencer_profiles').select('id').eq('id', user.id).single();
      if (inf) isInfluencerSystemUser = true;
    }
  }

  // 1. /admin/*
  if (ADMIN_PATTERNS.some(p => p.test(pathname))) {
    if (!user) return redirect('/login');
    if (role !== 'admin') return redirect('/');
    return supabaseResponse;
  }

  // 2. /account/*
  if (ACCOUNT_PATTERNS.some(p => p.test(pathname))) {
    if (!user) return redirect('/login');
    if (role === 'influencer') return redirect('/influencer/dashboard');
    return supabaseResponse; // Allow customer or admin
  }

  // 3. /influencer/dashboard/*
  if (INFLUENCER_DASHBOARD_PATTERNS.some(p => p.test(pathname))) {
    if (!user) return redirect('/influencer/login');
    if (!isInfluencerSystemUser) return redirect('/account');
    return supabaseResponse; // Allow influencer or admin or applicant
  }

  // 4. /influencer/login
  if (INFLUENCER_LOGIN_PATTERN.test(pathname)) {
    if (user) {
      if (isInfluencerSystemUser) return redirect('/influencer/dashboard');
      if (role === 'customer' || role === 'user') return redirect('/account');
    }
    return supabaseResponse; // Allow them to view login
  }

  // 5. /login & /register & /forgot-password
  if (CUSTOMER_LOGIN_PATTERN.test(pathname) || pathname === '/register' || pathname === '/forgot-password') {
    if (user) {
      if (role === 'influencer') return redirect('/influencer/dashboard');
      return redirect('/account'); // customer or admin goes to account
    }
    return supabaseResponse; // Allow them to view login
  }

  // 6. /checkout is now explicitly unprotected and handles guest flow natively

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files
     * - API webhook endpoints (Razorpay webhooks must not be blocked)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$|api/webhooks).*)',
  ],
};
