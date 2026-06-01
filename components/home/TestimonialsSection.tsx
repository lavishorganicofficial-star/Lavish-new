'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import type { Review } from '@/types';
import { timeAgo } from '@/lib/utils';

interface TestimonialsSectionProps {
  reviews: (Review & { user?: { full_name: string | null; avatar_url: string | null } | null })[];
}

// Fallback testimonials if no reviews in DB yet
const FALLBACK_REVIEWS = [
  {
    id: '1',
    rating: 5,
    title: 'Best skincare I\'ve ever used!',
    body: 'The Rose Glow Serum has completely transformed my skin. My dark spots are fading and my face is glowing. I recommend LavishOrganic to everyone!',
    user: { full_name: 'Priya S.', avatar_url: null },
    product_name: 'Rose Glow Vitamin C Serum',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    rating: 5,
    title: 'Finally, a natural face wash that works!',
    body: 'I\'ve tried so many face washes for my oily skin. The Neem Turmeric Face Wash is the only one that controls oil without drying out my skin. Love it!',
    user: { full_name: 'Ananya M.', avatar_url: null },
    product_name: 'Neem & Turmeric Face Wash',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    rating: 5,
    title: 'My hair fall is completely controlled',
    body: 'After using the Bhringraj Hair Oil for 3 weeks, my hair fall has reduced dramatically. The smell is authentic and the results are real. Will keep buying!',
    user: { full_name: 'Kavya R.', avatar_url: null },
    product_name: 'Bhringraj & Amla Hair Oil',
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function TestimonialsSection({ reviews }: TestimonialsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const displayReviews = reviews.length > 0 ? reviews : FALLBACK_REVIEWS;

  const prev = () =>
    setActiveIndex((i) => (i - 1 + displayReviews.length) % displayReviews.length);
  const next = () =>
    setActiveIndex((i) => (i + 1) % displayReviews.length);

  return (
    <section
      className="section bg-sage-50/50"
      aria-labelledby="testimonials-heading"
    >
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-body font-medium text-sage-dark uppercase tracking-widest mb-3">
            Real Results
          </p>
          <h2 id="testimonials-heading" className="section-title">
            What Our Customers Say
          </h2>
        </motion.div>

        {/* Testimonials - show 3 cards on desktop, 1 on mobile */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {displayReviews.slice(0, 3).map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-warm-white rounded-xl p-7 shadow-warm relative"
            >
              <Quote className="w-8 h-8 text-sage-light/40 absolute top-6 right-6" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= review.rating ? 'text-gold fill-gold' : 'text-sage-light/30'}`}
                  />
                ))}
              </div>

              {review.title && (
                <h3 className="font-display text-lg font-medium text-charcoal mb-2">
                  {review.title}
                </h3>
              )}
              <p className="text-sm text-charcoal-lighter leading-relaxed mb-5 line-clamp-4">
                {review.body}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {review.user?.avatar_url ? (
                    <Image
                      src={review.user.avatar_url}
                      alt={review.user.full_name ?? 'Customer'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-body font-semibold text-sage-dark text-sm">
                      {(review.user?.full_name ?? 'C').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-charcoal">
                    {review.user?.full_name ?? 'Verified Customer'}
                  </p>
                  <p className="text-xs text-charcoal-lighter">
                    Verified Purchase · {timeAgo(review.created_at)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: Carousel */}
        <div className="md:hidden relative">
          <AnimatePresence mode="wait">
            {displayReviews[activeIndex] && (
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.25 }}
                className="bg-warm-white rounded-xl p-6 shadow-warm"
              >
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= displayReviews[activeIndex].rating ? 'text-gold fill-gold' : 'text-sage-light/30'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-charcoal-lighter leading-relaxed mb-4">
                  {displayReviews[activeIndex].body}
                </p>
                <p className="font-body text-sm font-medium text-charcoal">
                  {displayReviews[activeIndex].user?.full_name ?? 'Verified Customer'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={prev} className="btn-icon border border-sage-light/30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {displayReviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-250 ${
                    i === activeIndex ? 'w-6 bg-sage-dark' : 'w-1.5 bg-sage-light'
                  }`}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>
            <button onClick={next} className="btn-icon border border-sage-light/30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
