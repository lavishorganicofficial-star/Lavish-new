import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { FlashSale } from '@/components/home/FlashSale';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { InstagramGrid } from '@/components/home/InstagramGrid';
import { NewsletterSection } from '@/components/home/NewsletterSection';

export const metadata: Metadata = {
  title: 'LavishOrganic — 100% Organic Skincare & Wellness | Made in India',
  description:
    'Shop premium certified organic skincare, hair care & wellness products. Cruelty-free, dermatologist tested, made in India. Free shipping over ₹499.',
};

export const dynamic = 'force-dynamic'; // always fetch fresh data so admin changes show immediately

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(*)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true })
    .limit(6);

  // Fetch active flash sale offer
  const { data: flashSale } = await supabase
    .from('offers')
    .select('*')
    .eq('type', 'flash_sale')
    .eq('is_active', true)
    .lte('starts_at', new Date().toISOString())
    .gt('ends_at', new Date().toISOString())
    .single();

  // Fetch active hero slides for the carousel
  const { data: heroSlides } = await supabase
    .from('hero_slides')
    .select('id, image_url, title, subtitle, link_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Fetch approved reviews for testimonials
  const { data: reviews } = await supabase
    .from('product_reviews')
    .select(`
      *,
      user:profiles(full_name, avatar_url)
    `)
    .eq('is_approved', true)
    .order('helpful_count', { ascending: false })
    .limit(6);

  return (
    <>
      {/* 1. Hero */}
      <HeroSection slides={heroSlides ?? []} />

      {/* 2. Categories */}
      <CategoryGrid categories={categories ?? []} />

      {/* 3. Featured Products */}
      <FeaturedProducts products={featuredProducts ?? []} />

      {/* 4. Flash Sale (conditional) */}
      {flashSale && <FlashSale offer={flashSale} />}

      {/* 5. Why Choose Us */}
      <WhyChooseUs />

      {/* 6. Testimonials */}
      <TestimonialsSection reviews={reviews ?? []} />

      {/* 7. Instagram Grid */}
      <InstagramGrid />

      {/* 8. Newsletter */}
      <NewsletterSection />
    </>
  );
}
