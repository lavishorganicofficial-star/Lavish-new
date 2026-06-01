import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/ProductForm';

export const metadata: Metadata = { title: 'Add Product | LavishOrganic Admin' };

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from('categories').select('id, name').eq('is_active', true);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="btn-icon">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Add New Product</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">Create a new product listing</p>
        </div>
      </div>

      <ProductForm categories={categories ?? []} />
    </div>
  );
}
