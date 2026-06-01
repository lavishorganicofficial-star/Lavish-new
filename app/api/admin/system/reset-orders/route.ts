import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUser = await createClient();
    
    // 1. Verify Authentication & Authorization
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabaseUser.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 2. Verify Confirmation String
    const { confirmation } = await request.json();
    if (confirmation !== 'CLEAR_ORDERS') {
      return NextResponse.json({ error: 'Invalid confirmation string' }, { status: 400 });
    }

    console.log('[Reset Orders] Initiated by Admin:', user.email);
    const supabaseAdmin = await createAdminClient();

    // 3. Delete Data in correct order
    const tablesToWipe = [
      'stock_movements',
      'purchase_order_items',
      'purchase_orders',
      'order_items', 
      'payment_transactions', 
      'notifications',
      'orders', 
      'cart_items'
    ];

    for (const table of tablesToWipe) {
      const { error } = await supabaseAdmin.from(table).delete().not('id', 'is', null);
      if (error) {
         console.warn(`[Reset Orders] Failed to wipe table ${table}:`, error.message);
      } else {
         console.log(`[Reset Orders] Wiped table: ${table}`);
      }
    }

    // 4. Reset product variant stock to 0
    const { error: stockError } = await supabaseAdmin
      .from('product_variants')
      .update({ stock_quantity: 0 })
      .not('id', 'is', null);

    if (stockError) {
      console.warn(`[Reset Orders] Failed to reset stock quantities:`, stockError.message);
    }

    return NextResponse.json({ success: true, message: 'Orders, revenue, and stock reset successfully.' });
  } catch (error: any) {
    console.error('[Reset Orders] Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
