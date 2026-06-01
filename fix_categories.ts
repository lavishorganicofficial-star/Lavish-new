import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zlktrlpupetgonbcczyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa3RybHB1cGV0Z29uYmNjenluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1MDkxMywiZXhwIjoyMDk1NjI2OTEzfQ.72FSzeW7Jwrz5oA6Knh_LO1_37V4VbvR_MA9lvH1XdI'
);

async function fixCategories() {
  const updates = [
    { slug: 'face-care', image_url: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780121400/lavishorganic/categories/yanp2fhgwenzfcukzwwd.png' },
    { slug: 'body-care', image_url: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780121425/lavishorganic/categories/srgwujc5pilqekxfwagj.png' },
    { slug: 'hair-care', image_url: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780121455/lavishorganic/categories/xtabxadtnx0z9pf9gxj6.png' },
    { slug: 'wellness', image_url: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780121519/lavishorganic/categories/aiq1k8n9w95nkgiraolv.png' },
    { slug: 'combo-sets', image_url: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780121585/lavishorganic/categories/g4dgo1w3wwynkqlksqy5.png' }
  ];

  for (const update of updates) {
    const { error } = await supabase.from('categories').update({ image_url: update.image_url }).eq('slug', update.slug);
    if (error) console.error('Error updating', update.slug, error);
    else console.log('Updated', update.slug);
  }
}

fixCategories();
