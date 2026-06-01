const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testReview() {
  console.log("Testing review insert...");
  
  // get a valid product id and user id
  const { data: products } = await supabase.from('products').select('id').limit(1);
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  
  const productId = products[0].id;
  const userId = users[0].id;

  // Test the insert without is_verified and status
  const { error: insertError } = await supabase
    .from('product_reviews')
    .insert({
      product_id: productId,
      user_id: userId,
      rating: 5,
      title: 'Test',
      body: 'Test body',
      images: []
    });

  console.log('Insert Error 2:', insertError ? insertError.message : 'None');
  
  if (!insertError) {
     await supabase.from('product_reviews').delete().eq('user_id', userId).eq('title', 'Test');
  }
}

testReview();
