import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zlktrlpupetgonbcczyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa3RybHB1cGV0Z29uYmNjenluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1MDkxMywiZXhwIjoyMDk1NjI2OTEzfQ.72FSzeW7Jwrz5oA6Knh_LO1_37V4VbvR_MA9lvH1XdI'
);

async function fixCategories() {
  const { error } = await supabase.from('categories').update({ hero_image_url: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780123385/lavishorganic/categories/fltnntqmek8hq3o8yyk1.png' }).eq('slug', 'face-care');
  if (error) console.error('Error updating', error);
  else console.log('Updated hero_image_url for face-care');
}

fixCategories();
