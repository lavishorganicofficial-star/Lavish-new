import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { renderPayoutReceiptStream } from '@/components/pdf/PayoutReceipt';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    // 1. Fetch Payout
    const { data: payout } = await supabase
      .from('influencer_payouts')
      .select('*')
      .eq('id', id)
      .single();

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    // 2. Fetch Influencer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', payout.influencer_id)
      .single();

    // 3. Fetch settled transactions (transactions updated around the same time with this payout's ref/method, or we could add payout_id to commission_transactions later. Since we didn't add payout_id, we can match by influencer_id and paid_at roughly matching created_at of payout, but let's just fetch all 'paid' for this influencer that were paid around the same time)
    // Actually, we set payment_reference to 'Bulk Payout' or whatever. Since we didn't add a direct FK `payout_id` to `commission_transactions` in the prompt, we'll just fetch a few recent paid ones or rely on the total. 
    // To be precise, we can query by `paid_at` within a 1-minute window of `payout.created_at`.
    const payoutTime = new Date(payout.created_at);
    const minTime = new Date(payoutTime.getTime() - 60000).toISOString();
    const maxTime = new Date(payoutTime.getTime() + 60000).toISOString();

    const { data: transactions } = await supabase
      .from('commission_transactions')
      .select('order_number, order_total, commission_rate, commission_amount')
      .eq('influencer_id', payout.influencer_id)
      .eq('status', 'paid')
      .gte('paid_at', minTime)
      .lte('paid_at', maxTime);

    const stream = await renderPayoutReceiptStream(payout, profile, transactions || []);
    
    // We have to convert the Node.js ReadableStream to a Web ReadableStream
    // Or we can just return it via a standard Response if it's compatible
    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Payout-${payout.payout_number}.pdf"`,
      },
    });

  } catch (err) {
    console.error('PDF Generation Error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
