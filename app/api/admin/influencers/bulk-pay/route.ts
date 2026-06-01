import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendWhatsAppCommissionPaid } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const { payouts } = await request.json(); // Array of { influencerId, amount, paymentMethod }

    if (!payouts || !Array.isArray(payouts) || payouts.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const results = [];

    // Process sequentially to avoid race conditions on transactions
    for (const payout of payouts) {
      const { influencerId, amount, paymentMethod } = payout;
      
      try {
        // Fetch pending txs
        const { data: pendingTxs } = await supabase
          .from('commission_transactions')
          .select('id, commission_amount')
          .eq('influencer_id', influencerId)
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        if (!pendingTxs || pendingTxs.length === 0) continue;

        let totalSelected = 0;
        const selectedTxIds: string[] = [];

        for (const tx of pendingTxs) {
          if (totalSelected >= amount) break;
          totalSelected += Number(tx.commission_amount);
          selectedTxIds.push(tx.id);
        }

        if (selectedTxIds.length === 0) continue;

        // Generate payout number
        const { data: payoutNumData } = await supabase.rpc('generate_payout_number');
        const payoutNumber = payoutNumData || `PAY-${Date.now()}-${influencerId.substring(0,4)}`;

        // Insert Payout Record
        const { data: payoutRecord, error: payoutErr } = await supabase
          .from('influencer_payouts')
          .insert({
            payout_number: payoutNumber,
            influencer_id: influencerId,
            total_amount: totalSelected,
            transaction_count: selectedTxIds.length,
            payment_method: paymentMethod,
            payment_reference: 'Bulk Payout'
          })
          .select()
          .single();

        if (payoutErr) throw payoutErr;

        // Update Transactions
        await supabase
          .from('commission_transactions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: paymentMethod,
            payment_reference: 'Bulk Payout'
          })
          .in('id', selectedTxIds);

        // Fetch user info for whatsapp
        const { data: inf } = await supabase.from('profiles').select('full_name, phone').eq('id', influencerId).single();
        if (inf?.phone) {
          sendWhatsAppCommissionPaid({
            phone: inf.phone,
            name: inf.full_name?.split(' ')[0] || 'Partner',
            amount: totalSelected,
            reference: payoutNumber
          }).catch(console.error);
        }

        results.push({ influencerId, status: 'success', amount: totalSelected });
      } catch (err: any) {
        console.error(`Failed bulk payout for ${influencerId}:`, err);
        results.push({ influencerId, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('[Admin Bulk Payout Error]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
