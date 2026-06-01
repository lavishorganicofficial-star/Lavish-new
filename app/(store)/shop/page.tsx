/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/ProductCard';
import { ShopFilters } from '@/components/shop/ShopFilters';
import { ShopPagination } from '@/components/shop/ShopPagination';
import { ProductSkeleton } from '@/components/shop/ProductSkeleton';
import type { ProductFilters } from '@/types';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shop All Organic Skincare & Wellness Products',
  description:
    'Browse LavishOrganic\'s complete collection of 100% certified organic skincare, hair care & wellness products. Free shipping over ₹499.',
};

interface ShopPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;

  const page = Math.max(1, parseInt(resolvedParams.page ?? '1'));
  const limit = 24;
  const offset = (page - 1) * limit;
  const category = resolvedParams.category;
  const search = resolvedParams.search;
  const sort = resolvedParams.sort ?? 'newest';
  const minPrice = resolvedParams.min_price;
  const maxPrice = resolvedParams.max_price;
  const inStock = resolvedParams.in_stock === 'true';

  // Base query
  let query = supabase
    .from('products')
    .select('*, category:categories(id,name,slug), images:product_images(*)', { count: 'exact' })
    .eq('is_active', true);

  // Category filter
  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id, name')
      .eq('slug', category)
      .single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  // Search
  if (search && search.length >= 2) {
    query = (query as any).ilike('name', `%${search}%`);
  }

  if (minPrice) query = query.gte('price', parseFloat(minPrice));
  if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
  if (inStock) query = query.gt('stock_quantity', 0);

  // Sort
  switch (sort) {
    case 'price_asc': query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    default: query = query.order('created_at', { ascending: false }); break;
  }

  query = query.range(offset, offset + limit - 1);
  const { data: products, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / limit);

  // Fetch categories for filter sidebar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order');

  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-medium text-charcoal">
            {category
              ? categories?.find((c) => c.slug === category)?.name ?? 'Shop'
              : search
              ? `Results for "${search}"`
              : 'Shop All Products'}
          </h1>
          <p className="text-charcoal-lighter mt-2 text-sm font-body">
            {count ?? 0} product{(count ?? 0) !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ShopFilters
              categories={categories ?? []}
              activeCategory={category}
              sort={sort}
              minPrice={minPrice}
              maxPrice={maxPrice}
              inStock={inStock}
            />
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter bar */}
            <div className="lg:hidden flex items-center justify-between mb-6 gap-3">
              <ShopFilters
                categories={categories ?? []}
                activeCategory={category}
                sort={sort}
                minPrice={minPrice}
                maxPrice={maxPrice}
                inStock={inStock}
                mobile
              />
            </div>

            {/* Grid */}
            {products && products.length > 0 ? (
              <>
                <div className="product-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12">
                    <ShopPagination
                      currentPage={page}
                      totalPages={totalPages}
                      searchParams={resolvedParams}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌿</span>
                </div>
                <h3 className="font-display text-xl text-charcoal mb-2">No products found</h3>
                <p className="text-charcoal-lighter text-sm">
                  Try adjusting your filters or{' '}
                  <Link href="/shop" className="text-sage-dark underline">browse all products</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
