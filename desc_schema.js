const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function describeTable() {
  const { data, error } = await supabase.from('influencer_profiles').select('*').limit(1);
  if (error) console.log(error);
  else {
    // get columns from the first row or an empty insert
    console.log(data);
  }
}
describeTable();
