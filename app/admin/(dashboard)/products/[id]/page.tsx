import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/ProductForm';

export const metadata: Metadata = { title: 'Edit Product | LavishOrganic Admin' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const supabase = await createClient();

  const [categoriesResponse, productResponse] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true),
    supabase.from('products').select('*, images:product_images(id, url, is_primary, sort_order, cloudinary_id)').eq('id', id).single()
  ]);

  if (productResponse.error || !productResponse.data) {
    notFound();
  }

  const categories = categoriesResponse.data ?? [];
  const product = productResponse.data;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="btn-icon">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Edit Product</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">Update details for {product.name}</p>
        </div>
      </div>

      <ProductForm categories={categories} initialData={product} />
    </div>
  );
}
