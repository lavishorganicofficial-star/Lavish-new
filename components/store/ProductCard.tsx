'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, Eye, Share2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useToast } from '@/store/uiStore';
import {
  formatCurrency,
  calculateDiscountPercentage,
  getPrimaryImageUrl,
  cn,
} from '@/lib/utils';
import { trackAddToCart, track } from '@/lib/analytics';
import { createClient } from '@/lib/supabase/client';
import type { ProductListItem } from '@/types';

interface ProductCardProps {
  product: ProductListItem;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const router = useRouter();

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const toast = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const inWishlist = isMounted ? isInWishlist(product.id) : false;
  const imageUrl = getPrimaryImageUrl(product.images);
  const discountPercent =
    product.compare_price && product.compare_price > product.price
      ? calculateDiscountPercentage(product.compare_price, product.price)
      : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock_quantity === 0) {
      toast.error('Out of Stock', 'This product is currently unavailable.');
      return;
    }

    setIsAddingToCart(true);
    try {
      addItem(product, null, 1);
      toast.success('Added to cart!', product.name);
      trackAddToCart(product.id, 1);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    const added = !inWishlist;
    
    toast.info(
      added ? 'Added to wishlist' : 'Removed from wishlist',
      product.name
    );
    
    if (added) {
      track('add_to_wishlist', { productId: product.id });
      // Guest check
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) {
        toast.info('Guest', 'Login to save your wishlist permanently');
      }
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/shop/${product.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on LavishOrganic!`,
          url: url,
        });
      } catch (err) {
        // Ignore abort errors
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Copied!', 'Product link copied to clipboard');
    }
  };

  return (
    <motion.article
      className={cn('group relative', className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Link
        href={`/shop/${product.slug}`}
        className="block"
        aria-label={`View ${product.name}`}
      >
        {/* Image Container */}
        <div className="relative aspect-product rounded-lg overflow-hidden bg-sage-50 mb-3">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-transform duration-500',
              isHovered ? 'scale-108' : 'scale-100'
            )}
            style={{ scale: isHovered ? 1.08 : 1 }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discountPercent && (
              <span className="badge bg-red-500 text-white font-semibold text-[11px]">
                -{discountPercent}%
              </span>
            )}
            {product.is_featured && (
              <span className="badge bg-gold text-charcoal font-semibold text-[11px]">
                Bestseller
              </span>
            )}
            {product.stock_quantity === 0 && (
              <span className="badge bg-charcoal/70 text-white text-[11px]">
                Out of Stock
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div
            className={cn(
              'absolute top-3 right-3 flex flex-col gap-2 transition-all duration-250',
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            )}
          >
            {/* Wishlist */}
            <button
              onClick={handleToggleWishlist}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shadow-warm transition-all duration-150',
                inWishlist
                  ? 'bg-red-500 text-white'
                  : 'bg-warm-white text-charcoal hover:bg-red-50 hover:text-red-500'
              )}
              aria-label={
                inWishlist ? 'Remove from wishlist' : 'Add to wishlist'
              }
            >
              <Heart
                className="w-4 h-4"
                fill={inWishlist ? 'currentColor' : 'none'}
              />
            </button>

            {/* Quick View — must be a button (not Link) to avoid nested <a> inside outer card Link */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/shop/${product.slug}`);
              }}
              className="w-9 h-9 bg-warm-white rounded-full flex items-center justify-center shadow-warm text-charcoal hover:bg-sage-50 hover:text-sage-dark transition-colors"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-9 h-9 bg-warm-white rounded-full flex items-center justify-center shadow-warm text-charcoal hover:bg-sage-50 hover:text-sage-dark transition-colors"
              aria-label="Share product"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Overlay (on hover) */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 transition-all duration-250 origin-bottom',
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
            )}
          >
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stock_quantity === 0}
              className={cn(
                'w-full py-3 font-body text-sm font-medium tracking-wide flex items-center justify-center gap-2 transition-colors',
                product.stock_quantity === 0
                  ? 'bg-charcoal/50 text-white cursor-not-allowed'
                  : 'bg-sage-dark text-white hover:bg-sage-600'
              )}
              aria-label={`Add ${product.name} to cart`}
            >
              {isAddingToCart ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          {/* Category */}
          {product.category && (
            <p className="text-[11px] font-medium text-charcoal-lighter uppercase tracking-wider">
              {product.category.name}
            </p>
          )}

          {/* Name */}
          <h3 className="font-body text-sm font-medium text-charcoal leading-snug line-clamp-2 group-hover:text-sage-dark transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {(product.average_rating ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-3 h-3',
                      star <= Math.round(product.average_rating ?? 0)
                        ? 'text-gold fill-gold'
                        : 'text-sage-light/40'
                    )}
                  />
                ))}
              </div>
              {product.review_count && product.review_count > 0 && (
                <span className="text-[11px] text-charcoal-lighter">
                  ({product.review_count})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="font-body font-semibold text-charcoal">
              {formatCurrency(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-sm text-charcoal-lighter line-through">
                {formatCurrency(product.compare_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
