const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraint() {
  // We can't query pg_constraint via Supabase JS rest API unless we use rpc.
  // But we can query the table with different types to see which one works.
  
  const types = ['info', 'warning', 'success', 'error', 'general', 'order_confirmed', 'order_packed'];
  for (const type of types) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        title: 'Test',
        message: 'Test',
        type: type,
        is_read: false
      });
      
    if (!error) {
       console.log('Worked for type:', type);
       // clean up
       await supabase.from('notifications').delete().eq('user_id', '00000000-0000-0000-0000-000000000000');
    } else {
       console.log('Failed for type:', type, error.message);
    }
  }
}
checkConstraint();
