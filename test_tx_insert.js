const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  const { error } = await supabase.from('commission_transactions').insert({
    influencer_id: '3022ad5a-b310-43f9-9bda-dce3f3682e91',
    order_id: 'adf72b56-6baf-4675-b7e5-bf4e5fdbfbd1',
    order_number: 'LO-20260601-0020',
    order_total: 438.1,
    commission_rate: 10,
    commission_amount: 39.9,
    via_coupon: true,
    status: 'pending'
  });
  console.log("Insert Error:", error ? error.message : "Success");
}
testInsert();
