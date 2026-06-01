'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/types';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  // Sorted by sort_order, primary first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  if (!sortedImages.length) {
    return (
      <div className="aspect-product rounded-xl bg-sage-50 flex items-center justify-center">
        <span className="text-charcoal-lighter text-sm">No image available</span>
      </div>
    );
  }

  const active = sortedImages[activeIndex];

  const prev = () => setActiveIndex((i) => (i - 1 + sortedImages.length) % sortedImages.length);
  const next = () => setActiveIndex((i) => (i + 1) % sortedImages.length);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-product rounded-xl overflow-hidden bg-sage-50 cursor-zoom-in group"
        onClick={() => setZoomed(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <Image
              src={active.url}
              alt={active.alt_text ?? `${productName} - image ${activeIndex + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={activeIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 w-9 h-9 bg-warm-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4 text-charcoal" />
        </div>

        {/* Arrows (multiple images) */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-warm-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-warm-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-warm-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-warm-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {sortedImages.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all',
                index === activeIndex
                  ? 'border-sage-dark shadow-sm'
                  : 'border-transparent hover:border-sage-light'
              )}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? `${productName} thumbnail ${index + 1}`}
                width={64}
                height={80}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox / Zoom overlay */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-charcoal/90 z-50 flex items-center justify-center p-4"
            onClick={() => setZoomed(false)}
          >
            <button
              onClick={() => setZoomed(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-sm font-body"
              aria-label="Close zoom"
            >
              ✕ Close
            </button>
            <div className="relative w-full max-w-2xl max-h-[80vh] aspect-[4/5]">
              <Image
                src={active.url}
                alt={active.alt_text ?? productName}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
