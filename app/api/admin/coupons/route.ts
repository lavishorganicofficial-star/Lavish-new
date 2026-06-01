import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const supabaseAdmin = await createAdminClient();

    // Ensure influencer_id is null for manually created general coupons
    body.influencer_id = null;
    
    // Ensure code is uppercase
    if (body.code) {
      body.code = body.code.toUpperCase();
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Failed to create coupon:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Create coupon error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
