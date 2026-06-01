const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  // get a valid user id from profiles
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  if (!users || users.length === 0) return console.log('no users');
  const userId = users[0].id;
  
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Test',
      message: 'Test',
      type: 'order',
      icon: '✅',
      order_id: null,
      action_url: '/',
      is_read: false
    });
    
  console.log('Insert with extra columns:', error ? error.message : 'Success');
  
  // clean up
  await supabase.from('notifications').delete().eq('user_id', userId).eq('title', 'Test');
}
checkColumns();
