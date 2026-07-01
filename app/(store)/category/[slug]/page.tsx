import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/ProductCard';
import { SortSelect } from '@/components/category/SortSelect';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import type { ProductListItem } from '@/types';

// Category metadata: hero images, taglines, and descriptions for each category
const CATEGORY_META: Record<string, {
  heroImage: string;
  tagline: string;
  accentColor: string;
}> = {
  'face-care': {
    heroImage: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=1600&q=90',
    tagline: 'Radiant skin starts with pure ingredients',
    accentColor: '#ACE433',
  },
  'body-care': {
    heroImage: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1600&q=90',
    tagline: 'Nourish your body, love your skin',
    accentColor: '#ACE433',
  },
  'hair-care': {
    heroImage: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1600&q=90',
    tagline: 'Botanical blends for your best hair ever',
    accentColor: '#ACE433',
  },
  'wellness': {
    heroImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1600&q=90',
    tagline: 'Inner balance. Outer glow.',
    accentColor: '#ACE433',
  },
  'combo-sets': {
    heroImage: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=1600&q=90',
    tagline: 'The perfect organic gift for everyone',
    accentColor: '#ACE433',
  },
  'offers': {
    heroImage: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780299538/Gemini_Generated_Image_dn8wu9dn8wu9dn8w_patfsi.png',
    tagline: 'Premium organics — now at exclusive prices',
    accentColor: '#ACE433',
  },
};

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export const dynamic = 'force-dynamic'; // always fresh so admin hero image changes show immediately

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  if (slug === 'offers') {
    return {
      title: 'Special Offers & Deals | LavishOrganic',
      description: 'Shop our best organic skincare deals and limited-time offers.',
    };
  }

  const { data: category } = await supabase
    .from('categories')
    .select('name, meta_title, meta_description')
    .eq('slug', slug)
    .single();

  if (!category) return { title: 'Category Not Found' };

  return {
    title: category.meta_title || `${category.name} | LavishOrganic`,
    description: category.meta_description || '',
    alternates: {
      canonical: `https://lavishorganic.in/category/${slug}`,
    },
    openGraph: {
      title: category.meta_title || category.name,
      description: category.meta_description || '',
      url: `https://lavishorganic.in/category/${slug}`,
      images: category.image_url ? [{ url: category.image_url }] : [],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page, sort } = await searchParams;

  const supabase = await createClient();
  const currentPage = Math.max(1, parseInt(page ?? '1'));
  const limit = 24;
  const offset = (currentPage - 1) * limit;

  let categoryData: { id: string; name: string; description: string; image_url: string; hero_image_url: string | null } | null = null;
  let isOffersPage = slug === 'offers';

  if (!isOffersPage) {
    const { data } = await supabase
      .from('categories')
      .select('id, name, description, image_url, hero_image_url')
      .eq('slug', slug)
      .single();

    if (!data) notFound();
    categoryData = data;
  }

  // Build product query
  let query = supabase
    .from('products')
    .select('*, category:categories(id,name,slug), images:product_images(*)', { count: 'exact' })
    .eq('is_active', true);

  if (isOffersPage) {
    // Offers: products with a discount
    query = query.not('compare_price', 'is', null).gt('compare_price', 0);
  } else if (categoryData) {
    query = query.eq('category_id', categoryData.id);
  }

  // Sort
  const sortValue = sort ?? 'newest';
  if (sortValue === 'price_asc') query = query.order('price', { ascending: true });
  else if (sortValue === 'price_desc') query = query.order('price', { ascending: false });
  else if (sortValue === 'popular') query = query.order('review_count', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  query = query.range(offset, offset + limit - 1);

  const { data: products, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  const meta = CATEGORY_META[slug] ?? CATEGORY_META['face-care'];
  const pageTitle = isOffersPage ? 'Special Offers' : categoryData?.name ?? slug;
  const pageDesc = isOffersPage
    ? 'Shop our best deals and limited-time offers on premium organic products.'
    : categoryData?.description ?? '';

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: pageTitle,
    description: pageDesc,
    url: `https://lavishorganic.in/category/${slug}`,
    numberOfItems: products?.length ?? 0,
    itemListElement: products?.map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://lavishorganic.in/shop/${p.slug}`,
      name: p.name,
      image: p.images?.[0]?.url,
    })) ?? [],
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      {/* ── Hero Section ── */}
      <section className="w-full flex flex-col md:relative md:h-[60vh] md:min-h-[400px] md:max-h-[560px] md:overflow-hidden bg-sage-50">
        
        {/* Image Box */}
        <div className="relative w-full flex-shrink-0 md:absolute md:inset-0 md:z-0">
           {/* Desktop Image (fill container) */}
           <div className="hidden md:block absolute inset-0">
             <Image
                src={categoryData?.hero_image_url || meta.heroImage}
                alt={pageTitle}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 100vw"
              />
           </div>
           
           {/* Mobile Image (natural height, full width) */}
           <div className="block md:hidden w-full relative">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img 
               src={categoryData?.hero_image_url || meta.heroImage} 
               alt={pageTitle}
               className="w-full h-auto object-contain" 
             />
           </div>
        </div>

        {/* Hero Content (Below image on mobile, Overlaid on desktop) */}
        <div className="relative z-10 w-full flex flex-col justify-end px-6 md:px-12 lg:px-20 py-8 md:pb-12 md:absolute md:inset-0 md:bg-black/10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-charcoal-light md:text-white/90 text-sm mb-4 font-medium" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-sage-dark md:hover:text-white transition-colors drop-shadow-sm">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-charcoal md:text-white drop-shadow-sm">{pageTitle}</span>
          </nav>

          <p className="font-bold text-sm tracking-widest uppercase mb-2 md:drop-shadow-sm"
             style={{ color: meta.accentColor }}>
            {isOffersPage ? 'Limited Time' : 'Organic Collection'}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal md:text-white mb-3 leading-tight md:drop-shadow-lg">
            {pageTitle}
          </h1>
          <p className="text-charcoal-lighter md:text-white/90 text-lg max-w-lg font-body font-medium md:drop-shadow-sm">
            {meta.tagline}
          </p>
          <div className="flex items-center gap-3 mt-6">
            <span className="text-charcoal-lighter md:text-white/80 text-sm">{count ?? 0} products</span>
            <span className="w-1 h-1 rounded-full bg-sage-light md:bg-white/40" />
            <span className="text-charcoal-lighter md:text-white/80 text-sm">Free shipping over ₹499</span>
          </div>
        </div>
      </section>

      {/* ── Products Section ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <p className="text-charcoal-lighter text-sm">
            Showing <span className="font-semibold text-charcoal">{products?.length ?? 0}</span> of{' '}
            <span className="font-semibold text-charcoal">{count ?? 0}</span> products
          </p>
          <SortSelect value={sortValue} />
        </div>

        {/* Product Grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as unknown as ProductListItem} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <ShoppingBag className="w-14 h-14 text-sage-light mx-auto mb-4" />
            <h2 className="font-display text-xl font-medium text-charcoal mb-2">No products yet</h2>
            <p className="text-charcoal-lighter text-sm mb-6">
              We&apos;re adding products soon. Check back shortly!
            </p>
            <Link href="/shop" className="btn-primary">Browse All Products</Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`?page=${currentPage - 1}&sort=${sortValue}`}
                className="btn-secondary py-2 px-5 text-sm"
              >
                ← Previous
              </Link>
            )}
            <span className="flex items-center px-4 text-sm text-charcoal-lighter">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`?page=${currentPage + 1}&sort=${sortValue}`}
                className="btn-primary py-2 px-5 text-sm"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── Category Description Banner ── */}
      {pageDesc && (
        <section className="bg-sage-50 border-t border-sage-light/20 py-12">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-charcoal-lighter leading-relaxed">{pageDesc}</p>
          </div>
        </section>
      )}
    </div>
  );
}
