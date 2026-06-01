import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProductsDashboard } from '@/components/admin/products/ProductsDashboard';

export const metadata: Metadata = { title: 'Products | LavishOrganic Admin' };

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { q, status, page } = await searchParams;
  const currentPage = Number(page ?? 1);
  const pageSize = 20;

  let query = supabase
    .from('products')
    .select('id, name, slug, price, compare_price, stock_quantity, is_active, is_featured, category:categories(name), images:product_images(url, is_primary)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

  if (q) query = query.ilike('name', `%${q}%`);
  if (status === 'active') query = query.eq('is_active', true);
  if (status === 'inactive') query = query.eq('is_active', false);
  if (status === 'out_of_stock') query = query.eq('stock_quantity', 0);

  const { data: products, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <ProductsDashboard 
      initialProducts={products || []}
      count={count || 0}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}
