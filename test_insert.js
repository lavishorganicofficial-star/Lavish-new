const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testApply() {
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  if (!users?.length) return console.log('no users');
  const userId = users[0].id;

  const { error: insertError, data } = await supabase.from('influencer_profiles').insert({
      id: userId,
      instagram_handle: '@test',
      youtube_channel: null,
      follower_count: 1000,
      content_niche: 'beauty',
      status: 'pending'
  }).select();

  console.log('Insert Error:', insertError ? insertError.message : 'None');
  console.log('Inserted Data:', data);
}
testApply();
