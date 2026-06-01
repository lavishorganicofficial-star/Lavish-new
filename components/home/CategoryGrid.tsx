'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Category } from '@/types';

interface CategoryGridProps {
  categories: Category[];
}

// Mosaic layout: first category spans 2 rows on desktop
export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories.length) return null;

  return (
    <section className="section bg-cream" aria-labelledby="categories-heading">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-body font-medium text-sage-dark uppercase tracking-widest mb-3">
            Our Collections
          </p>
          <h2 id="categories-heading" className="section-title text-display-md">
            Explore by Category
          </h2>
        </motion.div>

        {/* Mosaic Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[180px] md:auto-rows-[220px]">
          {categories.slice(0, 5).map((category, index) => {
            const isLarge = index === 0; // first category spans 2 rows
            const imageUrl = category.image_url || category.hero_image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800';

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={isLarge ? 'row-span-2 col-span-1' : ''}
              >
                <Link
                  href={`/category/${category.slug}`}
                  className="group relative h-full rounded-xl overflow-hidden block bg-sage-50"
                  aria-label={`Shop ${category.name}`}
                >
                  {/* Image */}
                  <Image
                    src={imageUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent transition-opacity duration-300 group-hover:from-charcoal/80" />

                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-display text-white font-medium text-xl md:text-2xl mb-1">
                      {category.name}
                    </h3>
                    <p className="font-body text-white/60 text-xs tracking-wide flex items-center gap-1.5 transition-all duration-300 group-hover:text-white/80">
                      Shop Now
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
