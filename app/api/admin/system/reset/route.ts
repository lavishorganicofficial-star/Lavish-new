import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Use the standard client with cookies to identify the user
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
    if (confirmation !== 'RESET') {
      return NextResponse.json({ error: 'Invalid confirmation string' }, { status: 400 });
    }

    console.log('[Factory Reset] Initiated by Admin:', user.email);

    // Use the admin client (Service Role) to bypass RLS and delete data
    const supabaseAdmin = await createAdminClient();

    // 3. Delete Data in correct order to respect foreign keys
    const tablesToWipe = [
      'analytics_events',
      'analytics_daily',
      'product_analytics',
      'search_analytics',
      'stock_movements',
      'purchase_order_items',
      'purchase_orders',
      'commission_transactions',
      'influencer_clicks', 
      'influencer_payouts', 
      'influencer_profiles',
      'order_items', 
      'payment_transactions', 
      'orders', 
      'cart_items',
      'addresses', 
      'product_reviews', 
      'product_images', 
      'products',
      'categories', 
      'coupons', 
      'hero_slides', 
      'whatsapp_logs'
    ];

    for (const table of tablesToWipe) {
      const { error } = await supabaseAdmin.from(table).delete().not('id', 'is', null);
      if (error) {
         console.warn(`[Factory Reset] Failed to wipe table ${table}:`, error.message);
      } else {
         console.log(`[Factory Reset] Wiped table: ${table}`);
      }
    }

    // 4. Delete all users EXCEPT the current admin
    console.log('[Factory Reset] Deleting all non-admin users...');
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    let usersDeleted = 0;
    if (usersData?.users) {
      for (const u of usersData.users) {
        if (u.id !== user.id) {
          const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(u.id);
          if (!delError) usersDeleted++;
        }
      }
    }
    console.log(`[Factory Reset] Deleted ${usersDeleted} users.`);

    return NextResponse.json({ success: true, message: 'System wiped successfully.' });
  } catch (error: any) {
    console.error('[Factory Reset] Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
