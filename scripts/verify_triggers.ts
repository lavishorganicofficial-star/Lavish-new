import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  console.log('--- Inserting Test Order ---');
  
  // Fetch a real user
  const { data: userProfile } = await supabase.from('profiles').select('id').limit(1).single();

  // Create a fake order
  const { data: newOrder, error: insertErr } = await supabase
    .from('orders')
    .insert({
      order_number: `TEST-LO-${Math.floor(Math.random() * 100000)}`,
      user_id: userProfile?.id,
      subtotal: 1000,
      total: 1000,
      payment_method: 'cod',
      status: 'pending',
      shipping_address: { city: 'Test City', state: 'Test State', pincode: '123456', address_line_1: '123 Test St' },
      billing_address: { city: 'Test City', state: 'Test State', pincode: '123456', address_line_1: '123 Test St' }
    })
    .select()
    .single();

  if (insertErr) {
    console.error('Error inserting test order:', insertErr);
    return;
  }
  
  console.log('Inserted order:', newOrder.id);

  // Fetch a real product
  const { data: prod } = await supabase.from('products').select('id').limit(1).single();

  // Create fake order item to trigger stock
  const { error: itemErr } = await supabase
    .from('order_items')
    .insert({
      order_id: newOrder.id,
      product_id: prod?.id, 
      product_name: 'Test Product',
      quantity: 1,
      unit_price: 1000,
      total_price: 1000
    });
    
  if (itemErr) {
    console.error('Warning: could not insert item:', itemErr);
  }

  // Wait 1 sec
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- Verifying Payment Transactions ---');
  const { data: txns, error: txnErr } = await supabase
    .from('payment_transactions')
    .select('transaction_number, order_number, type, amount, status')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (txnErr) {
    console.error('Error fetching transactions:', txnErr);
  } else {
    console.log(txns?.length ? txns[0] : 'No transactions found.');
  }

  console.log('\n--- Verifying Orders ---');
  const { data: orders, error: orderErr } = await supabase
    .from('orders')
    .select('id, order_number, payment_method, status, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (orderErr) {
    console.error('Error fetching orders:', orderErr);
  } else {
    console.log(orders?.length ? orders : 'No orders found.');
  }

  console.log('\n--- Verifying Stock Movements ---');
  const { data: stocks, error: stockErr } = await supabase
    .from('stock_movements')
    .select('product_name, movement_type, quantity_change, quantity_after')
    .order('created_at', { ascending: false })
    .limit(1);

  if (stockErr) {
    console.error('Error fetching stock movements:', stockErr);
  } else {
    console.log(stocks?.length ? stocks[0] : 'No stock movements found.');
  }
}

verify();
