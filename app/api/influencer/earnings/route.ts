import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch influencer payouts
    const { data: payouts } = await supabase
      .from('influencer_payouts')
      .select('*')
      .eq('influencer_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        payouts: payouts || []
      }
    });

  } catch (error: any) {
    console.error('Error fetching influencer earnings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Logic to request a payout
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('pending_commission, status, bank_account_number, upi_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.pending_commission < 1000) {
      return NextResponse.json({ error: 'Minimum payout threshold is ₹1000' }, { status: 400 });
    }

    if (!profile.bank_account_number && !profile.upi_id) {
      return NextResponse.json({ error: 'Please add payout details in your profile settings first' }, { status: 400 });
    }

    // Create payout request
    const amountToPay = profile.pending_commission;

    // Deduct pending_commission from profile
    const { error: updateError } = await supabase
      .from('influencer_profiles')
      .update({ pending_commission: 0 })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Create payout record
    const { error: insertError } = await supabase
      .from('influencer_payouts')
      .insert({
        influencer_id: user.id,
        amount: amountToPay,
        status: 'pending',
        notes: 'Requested by partner'
      });

    if (insertError) {
      // Rollback logic would go here ideally (requires RPC or edge function in real prod)
      throw insertError;
    }

    return NextResponse.json({ success: true, message: 'Payout requested successfully!' });
  } catch (error: any) {
    console.error('Error requesting payout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
