/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { ProductReviews } from '@/components/product/ProductReviews';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import type { Product } from '@/types';
import Link from 'next/link';
import { ProductViewTracker } from '@/components/store/ProductViewTracker';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, short_description, images:product_images(url, is_primary)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) return { title: 'Product Not Found' };

  const primaryImage = (product.images as Array<{url: string; is_primary: boolean}>)
    ?.find((i) => i.is_primary)?.url;

  return {
    title: `${product.name} | LavishOrganic`,
    description: product.short_description ?? `Buy ${product.name} online at LavishOrganic`,
    openGraph: {
      title: product.name,
      description: product.short_description ?? '',
      images: primaryImage ? [{ url: primaryImage }] : [],
    },
  };
}

export const dynamic = 'force-dynamic'; // always fresh so admin image updates show immediately


export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(*),
      variants:product_variants(*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) notFound();

  // Fetch reviews
  const { data: reviews } = await supabase
    .from('product_reviews')
    .select('*, user:profiles(full_name, avatar_url)')
    .eq('product_id', product.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch related products (same category)
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug), images:product_images(*)')
    .eq('category_id', product.category_id ?? '')
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(4);

  // Calculate average rating
  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description,
    image: (product.images as Array<{url: string}>)?.map((i) => i.url) ?? [],
    brand: { '@type': 'Brand', name: 'LavishOrganic' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability:
        product.stock_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    aggregateRating:
      reviews?.length
        ? {
            '@type': 'AggregateRating',
            ratingValue: avgRating.toFixed(1),
            reviewCount: reviews.length,
          }
        : undefined,
  };

  return (
    <>
      <ProductViewTracker productId={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="section">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-charcoal-lighter font-body mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-sage-dark transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-sage-dark transition-colors">Shop</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link href={`/category/${product.category.slug}`} className="hover:text-sage-dark transition-colors">
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-charcoal">{product.name}</span>
          </nav>

          {/* Product Hero: Gallery + Info */}
          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            <ProductGallery
              images={(product.images as any[]) ?? []}
              productName={product.name}
            />
            <ProductInfo
              product={product as unknown as Product}
              avgRating={avgRating}
              reviewCount={reviews?.length ?? 0}
            />
          </div>

          {/* Reviews */}
          <ProductReviews
            productId={product.id}
            reviews={(reviews as any[]) ?? []}
            avgRating={avgRating}
          />

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="font-display text-3xl font-medium text-charcoal mb-8">
                You May Also Like
              </h2>
              <RelatedProducts products={relatedProducts as any[]} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
