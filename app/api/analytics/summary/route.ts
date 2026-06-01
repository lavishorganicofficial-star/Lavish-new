import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d'; // 7d, 30d, 90d

    let days = 7;
    if (range === '30d') days = 30;
    if (range === '90d') days = 90;

    const adminDb = await createAdminClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all events in the date range
    const { data: events, error } = await adminDb
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Process summary metrics
    const visitors = new Set(events.map(e => e.visitor_id)).size;
    const sessions = new Set(events.map(e => e.session_id)).size;
    const pageViews = events.filter(e => e.event_type === 'page_view').length;
    const addToCarts = events.filter(e => e.event_type === 'add_to_cart').length;
    const checkoutStarts = events.filter(e => e.event_type === 'checkout_start').length;
    const checkoutCompletes = events.filter(e => e.event_type === 'checkout_complete').length;

    const conversionRate = sessions > 0 ? (checkoutCompletes / sessions) * 100 : 0;

    // Daily chart data for page views and visitors
    const dailyData: Record<string, { views: number; visitors: Set<string> }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { views: 0, visitors: new Set() };
    }

    events.forEach(e => {
      const dateStr = new Date(e.created_at).toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        if (e.event_type === 'page_view') {
          dailyData[dateStr].views++;
        }
        dailyData[dateStr].visitors.add(e.visitor_id);
      }
    });

    const chartData = Object.keys(dailyData).map(date => ({
      date,
      views: dailyData[date].views,
      visitors: dailyData[date].visitors.size,
    }));

    return NextResponse.json({
      success: true,
      data: {
        visitors,
        sessions,
        pageViews,
        addToCarts,
        checkoutStarts,
        checkoutCompletes,
        conversionRate,
        chartData
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
