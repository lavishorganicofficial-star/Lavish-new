const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkInfluencers() {
  const { data, error } = await supabase.from('influencer_profiles').select('*');
  console.log('Error:', error?.message);
  console.log('Data count:', data?.length);
  if (data?.length > 0) console.log(data[0]);
}
checkInfluencers();
