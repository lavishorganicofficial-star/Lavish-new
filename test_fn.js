const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkFunction() {
  const { data, error } = await supabase.rpc('get_influencer_stats', { inf_id: '3022ad5a-b310-43f9-9bda-dce3f3682e91' });
  console.log('Error:', error?.message);
  console.log('Data:', data);
}
checkFunction();
