import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    let query = supabase
      .from('products')
      .select('*, categories(name)')
      .order('stock_quantity', { ascending: true }); // Lowest stock first

    if (q) {
      query = query.ilike('name', `%${q}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Flatten category name
    const formattedData = data.map(p => ({
      ...p,
      category_name: p.categories?.name || 'Uncategorized'
    }));

    return NextResponse.json({ data: formattedData });
  } catch (error: any) {
    console.error('Server error in inventory products:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
