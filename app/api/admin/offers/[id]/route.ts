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

    const { data, error } = await supabaseAdmin
      .from('offers')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update offer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Update offer error:', err);
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

    const { error } = await supabaseAdmin
      .from('offers')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Failed to delete offer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete offer error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
