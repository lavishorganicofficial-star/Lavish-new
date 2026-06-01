import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Filters
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');

    let query = supabase
      .from('stock_movements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productId) query = query.eq('product_id', productId);
    if (type && type !== 'all') query = query.eq('movement_type', type);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching stock movements:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error: any) {
    console.error('Server error in stock movements:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
