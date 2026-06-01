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
    const supabaseAdmin = await createAdminClient();

    // Fetch existing coupon to check for influencer protection
    const { data: existingCoupon, error: fetchError } = await supabaseAdmin
      .from('coupons')
      .select('influencer_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Protect influencer coupons
    if (existingCoupon.influencer_id) {
      delete body.code;
      delete body.value;
      delete body.type;
      delete body.per_user_limit;
    } else {
      if (body.code) {
        body.code = body.code.toUpperCase();
      }
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update coupon:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Update coupon error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
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
    const supabaseAdmin = await createAdminClient();

    // Check influencer protection
    const { data: existingCoupon } = await supabaseAdmin
      .from('coupons')
      .select('influencer_id')
      .eq('id', params.id)
      .single();

    if (existingCoupon?.influencer_id) {
      return NextResponse.json({ error: 'Cannot delete influencer coupons from here' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Failed to delete coupon:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete coupon error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
