import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendWhatsAppCommissionPaid } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const { influencerId, amount, paymentMethod, paymentReference } = await request.json();

    if (!influencerId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payout data' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // 1. Fetch pending transactions up to the amount (FIFO)
    const { data: pendingTxs } = await supabase
      .from('commission_transactions')
      .select('id, commission_amount')
      .eq('influencer_id', influencerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!pendingTxs || pendingTxs.length === 0) {
      return NextResponse.json({ success: false, error: 'No pending commissions to pay' }, { status: 400 });
    }

    // 2. Select transactions that make up the amount
    let totalSelected = 0;
    const selectedTxIds: string[] = [];

    for (const tx of pendingTxs) {
      if (totalSelected >= amount) break;
      totalSelected += Number(tx.commission_amount);
      selectedTxIds.push(tx.id);
    }

    // Generate payout number
    const { data: payoutNumData } = await supabase.rpc('generate_payout_number');
    const payoutNumber = payoutNumData || `PAY-${Date.now()}`;

    // 3. Insert Payout Record
    const { data: payout, error: payoutErr } = await supabase
      .from('influencer_payouts')
      .insert({
        payout_number: payoutNumber,
        influencer_id: influencerId,
        total_amount: totalSelected,
        transaction_count: selectedTxIds.length,
        payment_method: paymentMethod,
        payment_reference: paymentReference
      })
      .select()
      .single();

    if (payoutErr) throw payoutErr;

    // 4. Update Transactions
    const { error: txErr } = await supabase
      .from('commission_transactions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        payment_reference: paymentReference
      })
      .in('id', selectedTxIds);

    if (txErr) throw txErr;

    // The trigger on `commission_transactions` handles updating `influencer_profiles`
    // (pending_commission decreases, paid_commission increases)

    // 5. Send WhatsApp notification
    const { data: inf } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', influencerId)
      .single();

    if (inf?.phone) {
      sendWhatsAppCommissionPaid({
        phone: inf.phone,
        name: inf.full_name?.split(' ')[0] || 'Partner',
        amount: totalSelected,
        reference: paymentReference || payoutNumber
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, data: payout });
  } catch (err: any) {
    console.error('[Admin Payout Error]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
