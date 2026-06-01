import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendWhatsAppRefundInitiated } from '@/lib/whatsapp';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      amount, 
      reason, 
      method, 
      bankName, 
      accountNumber, 
      ifsc, 
      upiId, 
      notes 
    } = body;
    
    const supabase = await createAdminClient();

    // Fetch the original transaction to link to the same order and user
    const { data: txn, error: fetchErr } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !txn) {
      return NextResponse.json({ error: 'Original transaction not found' }, { status: 404 });
    }

    // Insert a new refund_pending transaction
    const { data: refundTxn, error: insertErr } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_number: `RFD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*10000)}`,
        order_id: txn.order_id,
        order_number: txn.order_number,
        user_id: txn.user_id,
        customer_name: txn.customer_name,
        customer_phone: txn.customer_phone,
        customer_email: txn.customer_email,
        type: 'refund_pending',
        status: 'pending',
        amount: -Math.abs(amount), // Refunds are negative amounts
        refund_reason: reason,
        refund_method: method,
        refund_bank_name: bankName,
        refund_account: accountNumber,
        refund_ifsc: ifsc,
        refund_upi_id: upiId,
        notes: notes
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Update the original order's payment_status to 'refunded' if it was a full refund
    // For simplicity, just mark it as refunded here
    if (txn.order_id) {
      await supabase
        .from('orders')
        .update({ payment_status: 'refunded' })
        .eq('id', txn.order_id);
    }

    // WhatsApp notification logic
    if (txn.customer_phone) {
      sendWhatsAppRefundInitiated({
        phone: txn.customer_phone,
        amount: Math.abs(amount),
        orderNumber: txn.order_number,
        refundMethod: method,
        referenceNumber: refundTxn.transaction_number,
        orderId: txn.order_id
      }).catch(console.error);
    }

    return NextResponse.json(refundTxn);
  } catch (error: any) {
    console.error('Server error creating refund:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
