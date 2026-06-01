import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    let days = 30;
    if (range === '7d') days = 7;
    if (range === '90d') days = 90;

    const adminDb = await createAdminClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch product events
    const { data: events, error } = await adminDb
      .from('analytics_events')
      .select('event_type, product_id')
      .not('product_id', 'is', null)
      .gte('created_at', startDate.toISOString());

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Get all products to map names
    const { data: products } = await adminDb
      .from('products')
      .select('id, name, slug');

    const productMap = new Map((products || []).map(p => [p.id, p]));

    // Aggregate by product
    const stats: Record<string, { views: number; adds: number; checkouts: number }> = {};

    events.forEach(e => {
      if (!stats[e.product_id!]) {
        stats[e.product_id!] = { views: 0, adds: 0, checkouts: 0 };
      }
      if (e.event_type === 'product_view') stats[e.product_id!].views++;
      if (e.event_type === 'add_to_cart') stats[e.product_id!].adds++;
      if (e.event_type === 'checkout_complete') stats[e.product_id!].checkouts++;
    });

    // Format for response
    const productStats = Object.keys(stats).map(productId => {
      const p = productMap.get(productId);
      return {
        id: productId,
        name: p?.name || 'Unknown Product',
        slug: p?.slug || '',
        views: stats[productId].views,
        addToCarts: stats[productId].adds,
        checkouts: stats[productId].checkouts,
        conversionRate: stats[productId].views > 0 
          ? (stats[productId].checkouts / stats[productId].views) * 100 
          : 0
      };
    }).sort((a, b) => b.views - a.views);

    return NextResponse.json({ success: true, data: productStats });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
