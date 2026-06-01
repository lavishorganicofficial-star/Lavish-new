import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const supabaseUser = await createClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Admin
    const { data: adminProfile } = await supabaseUser.from('profiles').select('role').eq('id', user.id).single();
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await props.params;
    const body = await request.json();
    const {
      commission_rate,
      coupon_discount,
      commission_on_non_coupon_orders,
      non_coupon_commission_rate,
      coupon_per_user_limit,
      notes,
      referral_code
    } = body;

    const supabaseAdmin = await createAdminClient();

    // Update influencer_profiles
    const infUpdates: any = {};
    if (commission_rate !== undefined) infUpdates.commission_rate = commission_rate;
    if (coupon_discount !== undefined) infUpdates.coupon_discount = coupon_discount;
    if (commission_on_non_coupon_orders !== undefined) infUpdates.commission_on_non_coupon_orders = commission_on_non_coupon_orders;
    if (non_coupon_commission_rate !== undefined) infUpdates.non_coupon_commission_rate = non_coupon_commission_rate;
    if (coupon_per_user_limit !== undefined) infUpdates.coupon_per_user_limit = parseInt(coupon_per_user_limit, 10);
    if (notes !== undefined) infUpdates.notes = notes;

    if (Object.keys(infUpdates).length > 0) {
      const { error: infError } = await supabaseAdmin
        .from('influencer_profiles')
        .update(infUpdates)
        .eq('id', params.id);

      if (infError) {
        console.error('Failed to update influencer_profiles:', infError);
        return NextResponse.json({ error: 'Failed to update influencer settings' }, { status: 500 });
      }
    }

    // Update profiles (referral_code)
    if (referral_code !== undefined) {
      const { error: profError } = await supabaseAdmin
        .from('profiles')
        .update({ referral_code })
        .eq('id', params.id);

      if (profError) {
        console.error('Failed to update profile referral_code:', profError);
        return NextResponse.json({ error: 'Failed to update referral code (it may already be in use)' }, { status: 500 });
      }

      // Sync with coupons table
      if (referral_code) {
        // Upsert coupon
        const couponData = {
          code: referral_code.toUpperCase(),
          type: 'percentage',
          value: coupon_discount || 10, // fallback if not provided
          per_user_limit: coupon_per_user_limit !== undefined ? parseInt(coupon_per_user_limit, 10) : 1,
          influencer_id: params.id,
          is_active: true
        };
        
        const { error: couponError } = await supabaseAdmin
          .from('coupons')
          .upsert(couponData, { onConflict: 'code' });
          
        if (couponError) {
          console.error('Failed to sync coupon:', couponError);
          // Non-fatal error, but we should log it
        }
      }
    } else if (coupon_discount !== undefined) {
       // If only coupon discount changed, we should update their existing coupon if we know it.
       // Easiest is to fetch their current referral_code
       const { data: currentProfile } = await supabaseAdmin.from('profiles').select('referral_code').eq('id', params.id).single();
       if (currentProfile?.referral_code) {
         const updatePayload: any = {};
         if (coupon_discount !== undefined) updatePayload.value = coupon_discount;
         if (coupon_per_user_limit !== undefined) updatePayload.per_user_limit = parseInt(coupon_per_user_limit, 10);

         await supabaseAdmin
           .from('coupons')
           .update(updatePayload)
           .eq('code', currentProfile.referral_code.toUpperCase())
           .eq('influencer_id', params.id);
       }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Influencer update error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
