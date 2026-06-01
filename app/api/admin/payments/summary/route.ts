import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    
    // Date Range Filters
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('payment_transactions')
      .select('type, status, amount');

    if (from) query = query.gte('created_at', new Date(from).toISOString());
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
    }

    const { data: txns, error } = await query;

    if (error) {
      console.error('Error fetching summary:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate metrics
    let totalRevenue = 0;
    let collectedCod = 0;
    let pendingCod = 0;
    let failedOrders = 0;
    let failedAmount = 0;
    let refundsIssued = 0;
    let refundsIssuedCount = 0;
    let refundsPending = 0;
    let refundsPendingCount = 0;
    
    let collectedCodCount = 0;
    let pendingCodCount = 0;

    for (const t of txns || []) {
      const amt = Number(t.amount);
      
      // Assume positive amount and completed status is revenue (includes COD collected + Online Paid if any)
      if (t.status === 'completed' && amt > 0) {
        totalRevenue += amt;
      }

      if (t.type === 'cod_collected') {
        collectedCod += amt;
        collectedCodCount++;
      } else if (t.type === 'cod_pending') {
        pendingCod += amt;
        pendingCodCount++;
      } else if (t.type === 'cod_failed') {
        failedAmount += amt;
        failedOrders++;
      } else if (t.type === 'refund_issued') {
        refundsIssued += Math.abs(amt);
        refundsIssuedCount++;
      } else if (t.type === 'refund_pending') {
        refundsPending += Math.abs(amt);
        refundsPendingCount++;
      }
    }

    return NextResponse.json({
      totalRevenue,
      collected: { amount: collectedCod, count: collectedCodCount },
      pending: { amount: pendingCod, count: pendingCodCount },
      failed: { amount: failedAmount, count: failedOrders },
      refundsIssued: { amount: refundsIssued, count: refundsIssuedCount },
      refundsPending: { amount: refundsPending, count: refundsPendingCount }
    });
  } catch (error: any) {
    console.error('Server error in summary:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
