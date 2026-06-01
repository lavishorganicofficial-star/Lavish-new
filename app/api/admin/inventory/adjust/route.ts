import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { productId, adjustmentAmount, reason, type = 'adjustment' } = body;

    if (!productId || typeof adjustmentAmount !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Start by getting current stock
    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('id, name, stock_quantity')
      .eq('id', productId)
      .single();

    if (fetchErr || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentStock = product.stock_quantity || 0;
    const newStock = currentStock + adjustmentAmount;

    if (newStock < 0) {
      return NextResponse.json({ error: 'Cannot adjust stock below 0' }, { status: 400 });
    }

    // Update product stock
    const { error: updateErr } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', productId);

    if (updateErr) throw updateErr;

    // Log movement
    const { error: logErr } = await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        product_name: product.name,
        movement_type: type, // 'adjustment', 'damage', 'return', 'restock'
        quantity_before: currentStock,
        quantity_change: adjustmentAmount,
        quantity_after: newStock,
        reference_type: 'manual',
        reason: reason || 'Manual adjustment'
      });

    if (logErr) throw logErr;

    return NextResponse.json({ success: true, newStock });
  } catch (error: any) {
    console.error('Server error adjusting stock:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
