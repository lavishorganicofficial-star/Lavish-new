'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useToast } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ReviewFormProps {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewForm({ productId, onClose, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Rating required', 'Please select a star rating.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, rating, title, body }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Review Submitted', 'Thank you for your feedback!');
        onSuccess();
        router.refresh();
      } else {
        if (res.status === 401) {
          toast.error('Login Required', 'You must be logged in to submit a review.');
        } else {
          toast.error('Submission Failed', data.error || 'Failed to submit review.');
        }
      }
    } catch (err) {
      toast.error('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-sage-50/50 rounded-2xl p-6 border border-sage-light/30 mt-6 relative animate-in fade-in slide-in-from-top-4">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-charcoal-lighter hover:text-charcoal transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      
      <h3 className="font-display text-xl font-medium text-charcoal mb-4">Write a Review</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-2">Overall Rating *</label>
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={cn(
                    'w-8 h-8 transition-colors',
                    s <= (hoverRating || rating) ? 'text-gold fill-gold' : 'text-sage-light/30'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1">Headline</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's most important to know?"
            className="input w-full"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1">Written Review</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you like or dislike? What did you use this product for?"
            className="input w-full h-32 resize-none"
            maxLength={1000}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="btn-primary"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
