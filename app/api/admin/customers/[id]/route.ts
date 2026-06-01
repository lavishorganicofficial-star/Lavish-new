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
    const { data: profile } = await supabaseUser.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await props.params;
    const body = await request.json();
    
    const updateData: any = {};
    if (typeof body.cod_banned === 'boolean') updateData.cod_banned = body.cod_banned;
    if (typeof body.is_vip === 'boolean') updateData.is_vip = body.is_vip;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const supabaseAdmin = await createAdminClient();
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', params.id);

    if (error) {
      console.error('Failed to update customer:', error);
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Customer update error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
