import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: po, error: poErr } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (poErr) return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });

    const { data: items, error: itemsErr } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('purchase_order_id', id);

    if (itemsErr) throw itemsErr;

    return NextResponse.json({ ...po, items: items || [] });
  } catch (error: any) {
    console.error('Server error in PO Detail:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();
    const { status, notes } = body;
    
    const updates: any = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Server error in PO update:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
