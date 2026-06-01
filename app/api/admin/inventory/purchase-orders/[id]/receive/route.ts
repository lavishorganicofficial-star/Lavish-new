import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();
    const { itemsToReceive } = body; 
    // itemsToReceive: Array of { itemId, productId, quantityReceived }

    if (!itemsToReceive || itemsToReceive.length === 0) {
      return NextResponse.json({ error: 'No items provided to receive' }, { status: 400 });
    }

    // Process each item
    for (const item of itemsToReceive) {
      const { itemId, productId, quantityReceived } = item;
      
      if (quantityReceived <= 0) continue;

      // 1. Update PO Item
      // Fetch current item to see how many were ordered vs already received
      const { data: poItem, error: poItemErr } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('id', itemId)
        .single();
        
      if (poItemErr) continue;

      const newReceived = (poItem.quantity_received || 0) + quantityReceived;
      
      await supabase
        .from('purchase_order_items')
        .update({ quantity_received: newReceived })
        .eq('id', itemId);

      // 2. Update Product Stock
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', productId)
        .single();

      if (product) {
        const currentStock = product.stock_quantity || 0;
        const newStock = currentStock + quantityReceived;
        
        await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', productId);

        // 3. Log Stock Movement
        await supabase
          .from('stock_movements')
          .insert({
            product_id: productId,
            product_name: product.name,
            movement_type: 'restock',
            quantity_before: currentStock,
            quantity_change: quantityReceived,
            quantity_after: newStock,
            reference_id: id,
            reference_type: 'purchase_order',
            reason: 'Received from PO'
          });
      }
    }

    // 4. Update PO Status
    // Determine if all items are fully received
    const { data: allItems } = await supabase
      .from('purchase_order_items')
      .select('quantity_ordered, quantity_received')
      .eq('purchase_order_id', id);

    let allFullyReceived = true;
    let someReceived = false;

    if (allItems) {
      for (const i of allItems) {
        if (i.quantity_received > 0) someReceived = true;
        if (i.quantity_received < i.quantity_ordered) allFullyReceived = false;
      }
    }

    const newStatus = allFullyReceived ? 'received' : (someReceived ? 'partial' : 'sent');
    
    await supabase
      .from('purchase_orders')
      .update({ 
        status: newStatus,
        received_date: allFullyReceived ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    return NextResponse.json({ success: true, newStatus });
  } catch (error: any) {
    console.error('Server error receiving PO:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
