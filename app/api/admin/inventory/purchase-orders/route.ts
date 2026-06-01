import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Server error in PO GET:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { supplier_name, supplier_phone, supplier_email, notes, items } = body;

    if (!supplier_name || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate PO Number
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const { data: countData } = await supabase
      .from('purchase_orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]);
      
    const seq = ((countData as number | null) || 0) + 1;
    const poNumber = `PO-${today}-${seq.toString().padStart(4, '0')}`;

    // Calculate totals
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum: number, item: any) => sum + parseInt(item.quantity), 0);
    const totalCost = items.reduce((sum: number, item: any) => sum + (item.quantity * item.cost), 0);

    // Insert PO
    const { data: po, error: poErr } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_name,
        supplier_phone,
        supplier_email,
        notes,
        status: 'sent',
        total_items: totalItems,
        total_quantity: totalQuantity,
        total_cost: totalCost
      })
      .select()
      .single();

    if (poErr) throw poErr;

    // Insert Items
    const orderItems = items.map((item: any) => ({
      purchase_order_id: po.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity_ordered: item.quantity,
      cost_per_unit: item.cost
    }));

    const { error: itemsErr } = await supabase
      .from('purchase_order_items')
      .insert(orderItems);

    if (itemsErr) throw itemsErr;

    return NextResponse.json(po);
  } catch (error: any) {
    console.error('Server error in PO POST:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
