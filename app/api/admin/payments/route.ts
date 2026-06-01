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
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    let query = supabase
      .from('payment_transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(`transaction_number.ilike.%${q}%,order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
    }
    if (type && type !== 'all') query = query.eq('type', type);
    if (status && status !== 'all') query = query.eq('status', status);
    if (from) query = query.gte('created_at', new Date(from).toISOString());
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
    }
    if (minAmount) query = query.gte('amount', parseFloat(minAmount));
    if (maxAmount) query = query.lte('amount', parseFloat(maxAmount));

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error: any) {
    console.error('Server error in /api/admin/payments:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
