import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { collectedBy } = body;
    
    const supabase = await createAdminClient();

    // Fetch the transaction
    const { data: txn, error: fetchErr } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !txn) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (txn.type !== 'cod_pending') {
      return NextResponse.json({ error: 'Only pending COD transactions can be marked as collected.' }, { status: 400 });
    }

    // Update Transaction
    const { data: updatedTxn, error: updateErr } = await supabase
      .from('payment_transactions')
      .update({
        type: 'cod_collected',
        status: 'completed',
        collected_by: collectedBy || 'Admin',
        payment_collected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Also update the order payment_status to 'paid' and status to 'delivered' if not already
    // (In reality, delivering the order triggers the transaction update, but this is a manual override from payments page)
    if (txn.order_id) {
      await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', txn.order_id);
    }

    return NextResponse.json(updatedTxn);
  } catch (error: any) {
    console.error('Server error marking collected:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
