import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sessionId,
      visitorId,
      eventType,
      pagePath,
      productId,
      searchQuery,
      metadata,
      deviceType,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    const adminDb = await createAdminClient();

    // Insert into analytics_events table
    const { error } = await adminDb.from('analytics_events').insert({
      session_id: sessionId,
      visitor_id: visitorId,
      event_type: eventType,
      page_path: pagePath,
      product_id: productId,
      search_query: searchQuery,
      metadata: metadata || {},
      device_type: deviceType,
      referrer: referrer,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });

    if (error) {
      console.error('[Analytics Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Also populate search_analytics if event is search
    if (eventType === 'search' && searchQuery) {
      const { data: existingSearch } = await adminDb
        .from('search_analytics')
        .select('*')
        .eq('query', searchQuery.toLowerCase())
        .single();
      
      if (existingSearch) {
        await adminDb.from('search_analytics')
          .update({
            search_count: existingSearch.search_count + 1,
            last_searched_at: new Date().toISOString()
          })
          .eq('id', existingSearch.id);
      } else {
        await adminDb.from('search_analytics')
          .insert({
            query: searchQuery.toLowerCase(),
            results_count: metadata?.resultCount || 0,
            search_count: 1
          });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Analytics Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
