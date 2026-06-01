const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data, error } = await supabase.rpc('query', { sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'product_reviews';" });
  // Since we can't run raw SQL easily via JS, let's just fetch one row and log keys
  const { data: row } = await supabase.from('product_reviews').select('*').limit(1);
  if (row && row.length > 0) {
    console.log('Columns:', Object.keys(row[0]));
  } else {
    // If empty, we can try inserting with just product_id and user_id to see what error it throws, or use an admin method to query.
    console.log('No rows to infer schema. Please check manually.');
  }
}
checkSchema();
