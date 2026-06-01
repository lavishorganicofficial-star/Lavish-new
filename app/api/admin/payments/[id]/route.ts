import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Server error in transaction detail:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();
    
    // Allow updating status and notes
    const { status, notes } = body;
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('payment_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Server error in transaction update:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
