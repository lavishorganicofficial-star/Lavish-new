import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zlktrlpupetgonbcczyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa3RybHB1cGV0Z29uYmNjenluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1MDkxMywiZXhwIjoyMDk1NjI2OTEzfQ.72FSzeW7Jwrz5oA6Knh_LO1_37V4VbvR_MA9lvH1XdI'
);

const payload = {
  "name": "Wellness",
  "slug": "wellness",
  "description": "Support your inner health with our wellness range.",
  "image_url": "https://res.cloudinary.com/dtrin6lwv/image/upload/v1780121519/lavishorganic/categories/aiq1k8n9w95nkgiraolv.png",
  "hero_image_url": "https://res.cloudinary.com/dtrin6lwv/image/upload/v1780130800/lavishorganic/categories/d9roj8r7tb9mncoq6exu.png",
  "is_active": true,
  "meta_title": "Organic Wellness Products | LavishOrganic",
  "meta_description": "Herbal wellness products, essential oils, and aromatherapy.",
  "updated_at": "2026-05-30T08:46:45.641Z"
};

supabase
  .from('categories')
  .update(payload)
  .eq('id', '11111111-0000-0000-0000-000000000004')
  .then((res) => {
    console.log('Direct update error:', res.error);
    return supabase.from('categories').select('*').eq('id', '11111111-0000-0000-0000-000000000004').single();
  })
  .then((res) => console.log('Final DB State:', res.data));
