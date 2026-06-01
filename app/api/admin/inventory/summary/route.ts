import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, price');

    if (error) throw error;

    let totalProducts = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValue = 0;

    for (const p of products || []) {
      totalProducts++;
      const stock = p.stock_quantity || 0;
      
      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= 10) {
        lowStockCount++;
      }

      totalValue += (stock * (p.price || 0));
    }

    return NextResponse.json({
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalValue
    });
  } catch (error: any) {
    console.error('Server error in inventory summary:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
