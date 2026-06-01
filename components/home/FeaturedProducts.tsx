/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/store/ProductCard';
import type { Product } from '@/types';

interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products.length) return null;

  return (
    <section className="section bg-warm-white" aria-labelledby="featured-heading">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-xs font-body font-medium text-sage-dark uppercase tracking-widest mb-3">
              Customer Favourites
            </p>
            <h2 id="featured-heading" className="section-title">
              Bestselling Products
            </h2>
          </div>
          <Link
            href="/shop?featured=true"
            className="hidden sm:flex items-center gap-2 text-sm font-body font-medium text-sage-dark hover:gap-3 transition-all"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Product Grid */}
        <div className="product-grid">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <ProductCard product={product as any} />
            </motion.div>
          ))}
        </div>

        {/* Mobile "View All" */}
        <div className="sm:hidden text-center mt-8">
          <Link href="/shop" className="btn-secondary">
            View All Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

