import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AdminCategoriesClient } from '@/components/admin/AdminCategoriesClient';

export const metadata: Metadata = { title: 'Categories | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description, is_active, sort_order, image_url, hero_image_url, meta_title, meta_description')
    .order('sort_order', { ascending: true });

  return <AdminCategoriesClient initialCategories={categories ?? []} />;
}
