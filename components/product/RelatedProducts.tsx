/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { ProductCard } from '@/components/store/ProductCard';

interface RelatedProductsProps {
  products: any[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

