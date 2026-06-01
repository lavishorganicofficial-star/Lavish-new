import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get influencer profile
    const { data: influencerProfile } = await supabase
      .from('influencer_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!influencerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch recent 5 orders associated with this influencer (via coupon code)
    // We assume orders table has an influencer_code field, but if not we can use coupon_code
    const couponCode = influencerProfile.coupon_code;
    
    let recentOrders: any[] = [];
    if (couponCode) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, status, commission_earned')
        .eq('coupon_code', couponCode)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (orders) recentOrders = orders;
    }

    // Aggregate stats for last 30 days if needed, or just return overall stats from profile
    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalClicks: influencerProfile.total_clicks || 0,
          totalOrders: influencerProfile.total_orders || 0,
          totalEarned: influencerProfile.total_commission_earned || 0,
          pendingPayout: influencerProfile.pending_commission || 0,
        },
        recentOrders,
      }
    });

  } catch (error: any) {
    console.error('Error fetching influencer stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
