import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // 1. Sync all influencers who have a referral code but no coupon
    const { data: influencers } = await supabase
      .from('influencer_profiles')
      .select('*, profiles!influencer_profiles_id_fkey(referral_code)');

    let syncedCount = 0;
    if (influencers) {
      for (const inf of influencers) {
        if (inf.profiles?.referral_code) {
          const couponData = {
            code: inf.profiles.referral_code.toUpperCase(),
            type: 'percentage',
            value: inf.coupon_discount || 10,
            influencer_id: inf.id,
            is_active: true
          };
          await supabase.from('coupons').upsert(couponData, { onConflict: 'code' });
          syncedCount++;
        }
      }
    }

    // 2. We cannot run DDL (ALTER TABLE, CREATE TRIGGER) via supabase.rpc directly, 
    // unless we create a function, but we can't create a function.
    // I will write the SQL script that the user must run.

    return NextResponse.json({ 
      success: true, 
      message: `System Audit Complete. Synced ${syncedCount} missing coupons. You MUST run the final SQL script to fix the checkout trigger.`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
