const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log("Checking notifications table schema...");
  
  // Try to insert a dummy row to see if columns exist
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      title: 'Test',
      message: 'Test',
      type: 'general',
      icon: 'ℹ️',
      is_read: false
    })
    .select();

  console.log('Insert Test:', error ? error.message : 'Success');

  // Also check if RPC exists
  const { error: rpcError } = await supabase.rpc('create_order_notification', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_order_id: null,
    p_order_number: 'TEST',
    p_type: 'general',
    p_title: 'Title',
    p_message: 'Msg',
    p_action_url: '/'
  });

  console.log('RPC Test:', rpcError ? rpcError.message : 'Success');
}

checkDb();
