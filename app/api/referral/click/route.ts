import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, landingPage, referrer, sessionId, visitorId } = body;

    if (!code || !visitorId) {
      return NextResponse.json({ success: false, error: 'Missing code or visitorId' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // 1. Find influencer by referral_code
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, referral_code')
      .ilike('referral_code', code)
      .single();

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Influencer not found' }, { status: 404 });
    }

    // 2. Check if this visitorId already clicked today (prevent spam/duplicate counting)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('influencer_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('visitor_id', visitorId)
      .eq('influencer_id', profile.id)
      .gte('created_at', today.toISOString());

    if (count && count > 0) {
      // Already tracked today for this influencer, return success but don't insert duplicate
      return NextResponse.json({ success: true, message: 'Already tracked today' });
    }

    // 3. Insert into influencer_clicks
    const { error } = await supabase.from('influencer_clicks').insert({
      influencer_id: profile.id,
      session_id: sessionId,
      visitor_id: visitorId,
      landing_page: landingPage,
      referrer: referrer,
      device_type: getDeviceType(request.headers.get('user-agent') || ''),
    });

    if (error) {
      console.error('[Referral Click] Insert error:', error);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    // Trigger handles updating total_clicks on influencer_profiles

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Referral Click] Server error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function getDeviceType(userAgent: string) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}
