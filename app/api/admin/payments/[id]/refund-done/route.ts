import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reference } = body;
    
    if (!reference) {
      return NextResponse.json({ error: 'Bank reference / UTR number is required' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch the refund transaction
    const { data: txn, error: fetchErr } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !txn) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (txn.type !== 'refund_pending') {
      return NextResponse.json({ error: 'Only pending refunds can be marked as done.' }, { status: 400 });
    }

    // Update Transaction
    const { data: updatedTxn, error: updateErr } = await supabase
      .from('payment_transactions')
      .update({
        type: 'refund_issued',
        status: 'completed',
        refund_reference: reference,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json(updatedTxn);
  } catch (error: any) {
    console.error('Server error completing refund:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
