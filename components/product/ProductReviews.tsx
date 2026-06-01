'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, cn } from '@/lib/utils';
import type { Review } from '@/types';
import { ReviewForm } from './ReviewForm';

interface ProductReviewsProps {
  productId: string;
  reviews: (Review & { user?: { full_name: string | null; avatar_url: string | null } | null })[];
  avgRating: number;
}

export function ProductReviews({ productId, reviews, avgRating }: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length
      ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  return (
    <section className="border-t border-sage-light/30 pt-16" aria-labelledby="reviews-heading">
      <div className="flex items-center justify-between mb-10">
        <h2 id="reviews-heading" className="font-display text-3xl font-medium text-charcoal">
          Customer Reviews
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-secondary text-sm"
          id="write-review-btn"
        >
          Write a Review
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <ReviewForm 
            productId={productId} 
            onClose={() => setShowForm(false)} 
            onSuccess={() => setShowForm(false)} 
          />
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-12 mt-10">
        {/* Rating Summary */}
        <div>
          <div className="text-center mb-6">
            <div className="font-display text-7xl font-light text-charcoal">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </div>
            <div className="flex justify-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn('w-5 h-5', s <= Math.round(avgRating) ? 'text-gold fill-gold' : 'text-sage-light/30')}
                />
              ))}
            </div>
            <p className="text-sm text-charcoal-lighter font-body">{reviews.length} reviews</p>
          </div>

          {/* Distribution bars */}
          <div className="space-y-2">
            {distribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-charcoal-lighter w-3 font-body">{star}</span>
                <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                <div className="flex-1 h-2 bg-sage-light/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-charcoal-lighter w-4 text-right font-body">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Review List */}
        <div className="lg:col-span-2">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-sage-light/40 mx-auto mb-4" />
              <p className="text-charcoal-lighter font-body">
                No reviews yet. Be the first to review!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pb-8 border-b border-sage-light/20 last:border-0"
                >
                  {/* Author & Rating */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {review.user?.avatar_url ? (
                        <Image
                          src={review.user.avatar_url}
                          alt={review.user.full_name ?? 'Customer'}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-semibold text-sage-dark text-sm font-body">
                          {(review.user?.full_name ?? 'C').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-body font-semibold text-sm text-charcoal">
                          {review.user?.full_name ?? 'Verified Customer'}
                        </p>
                        {review.is_verified && (
                          <span className="badge badge-green text-[10px]">✓ Verified Purchase</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={cn('w-3 h-3', s <= review.rating ? 'text-gold fill-gold' : 'text-sage-light/30')} />
                          ))}
                        </div>
                        <span className="text-xs text-charcoal-lighter font-body">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="font-body font-semibold text-charcoal mb-1">{review.title}</h4>
                  )}
                  <p className="text-sm text-charcoal-light leading-relaxed font-body">{review.body}</p>

                  {/* Review images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, i) => (
                        <div key={i} className="w-16 h-16 rounded-md overflow-hidden">
                          <Image src={img} alt={`Review image ${i + 1}`} width={64} height={64} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  <button className="mt-3 flex items-center gap-1.5 text-xs text-charcoal-lighter hover:text-charcoal font-body transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Helpful ({review.helpful_count})
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
