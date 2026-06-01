const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRecentOrder() {
  console.log("Checking recent orders...");
  const { data: orders, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (orderErr) console.log("Order error:", orderErr);
  else console.log("Latest Order:", orders[0]);

  console.log("\nChecking commission transactions...");
  const { data: tx, error: txErr } = await supabase
    .from('commission_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (txErr) console.log("Tx error:", txErr);
  else console.log("Latest Tx:", tx);

  console.log("\nChecking influencer profile...");
  const { data: inf, error: infErr } = await supabase
    .from('influencer_profiles')
    .select('*')
    .limit(1);

  if (infErr) console.log("Inf error:", infErr);
  else console.log("Influencer:", inf[0]);
}
checkRecentOrder();
