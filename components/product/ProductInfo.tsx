/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Share2, Star, Truck, RotateCcw, Shield, ChevronDown, MapPin } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useToast } from '@/store/uiStore';
import { formatCurrency, calculateDiscountPercentage, isValidPincode, cn } from '@/lib/utils';
import { trackAddToCart } from '@/lib/analytics';
import { ShareButton } from '@/components/store/ShareButton';
import type { Product, ProductVariant } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface ProductInfoProps {
  product: Product;
  avgRating: number;
  reviewCount: number;
}

export function ProductInfo({ product, avgRating, reviewCount }: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<{
    serviceable: boolean;
    estimated_days?: number;
    courier_name?: string;
  } | null>(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('description');

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const toast = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const inWishlist = isMounted ? isInWishlist(product.id) : false;
  const currentPrice = product.price + (selectedVariant?.price_modifier ?? 0);
  const discountPercent = product.compare_price
    ? calculateDiscountPercentage(product.compare_price, currentPrice)
    : null;

  const handleAddToCart = async () => {
    if (product.stock_quantity === 0) {
      toast.error('Out of Stock', 'This product is currently unavailable.');
      return;
    }
    setAddingToCart(true);
    try {
      addItem(product as any, selectedVariant, quantity);
      toast.success('Added to cart!', `${quantity}× ${product.name}`);
      trackAddToCart(product.id, quantity);
    } finally {
      setAddingToCart(false);
    }
  };

  const checkDelivery = async () => {
    if (!isValidPincode(pincode)) {
      toast.error('Invalid pincode', 'Please enter a valid 6-digit pincode');
      return;
    }
    setCheckingDelivery(true);
    try {
      const res = await fetch(`/api/logistics/serviceability?pincode=${pincode}&weight=${(product.weight ?? 250) * 1000}`);
      const data = await res.json();
      if (data.success) {
        setDeliveryInfo(data.data);
      }
    } catch {
      toast.error('Check failed', 'Unable to check delivery. Please try again.');
    } finally {
      setCheckingDelivery(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      {/* Category */}
      {product.category && (
        <a
          href={`/category/${product.category.slug}`}
          className="text-xs font-body font-medium text-sage-dark uppercase tracking-widest hover:underline"
        >
          {product.category.name}
        </a>
      )}

      {/* Name */}
      <h1 className="font-display text-3xl md:text-4xl font-medium text-charcoal leading-tight">
        {product.name}
      </h1>

      {/* Rating */}
      {reviewCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn('w-4 h-4', s <= Math.round(avgRating) ? 'text-gold fill-gold' : 'text-sage-light/30')}
              />
            ))}
          </div>
          <span className="text-sm font-body text-charcoal-light">
            {avgRating.toFixed(1)} ({reviewCount} reviews)
          </span>
        </div>
      )}

      {/* Price */}
      <div className="flex items-center gap-3">
        <span className="font-display text-3xl font-semibold text-charcoal">
          {formatCurrency(currentPrice)}
        </span>
        {product.compare_price && product.compare_price > currentPrice && (
          <>
            <span className="text-lg text-charcoal-lighter line-through font-body">
              {formatCurrency(product.compare_price)}
            </span>
            <span className="badge bg-red-100 text-red-600 font-semibold text-sm">
              {discountPercent}% OFF
            </span>
          </>
        )}
      </div>
      <p className="text-xs text-charcoal-lighter font-body">
        Inclusive of all taxes · GST {product.gst_rate}% included
      </p>

      {/* Short description */}
      {product.short_description && (
        <p className="text-charcoal-light text-base leading-relaxed font-body">
          {product.short_description}
        </p>
      )}

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div>
          <p className="text-sm font-medium text-charcoal mb-3 font-body">
            Size / Variant:{' '}
            <span className="text-sage-dark">{selectedVariant?.name} {selectedVariant?.value}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={cn(
                  'px-4 py-2 rounded border text-sm font-body font-medium transition-all',
                  selectedVariant?.id === variant.id
                    ? 'border-sage-dark bg-sage-50 text-sage-dark'
                    : 'border-sage-light/50 text-charcoal-light hover:border-sage-dark'
                )}
                disabled={variant.stock_quantity === 0}
              >
                {variant.value}
                {variant.price_modifier !== 0 && (
                  <span className="ml-1 text-xs text-charcoal-lighter">
                    {variant.price_modifier > 0 ? '+' : ''}{formatCurrency(variant.price_modifier)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Main Actions Row */}
        <div className="flex items-center gap-3">
          {/* Qty */}
          <div className="flex items-center border border-sage-light/50 rounded overflow-hidden h-12 shrink-0">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-11 h-full flex items-center justify-center hover:bg-sage-50 transition-colors text-charcoal text-lg"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold font-body">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
              className="w-11 h-full flex items-center justify-center hover:bg-sage-50 transition-colors text-charcoal text-lg"
              disabled={quantity >= product.stock_quantity}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock_quantity === 0}
            className="flex-1 h-12 btn-primary text-base flex items-center justify-center shrink-0 min-w-0"
            id="product-add-to-cart"
          >
            {addingToCart ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-5 h-5 mr-2 shrink-0" />
                <span className="truncate">{product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>

        {/* Secondary Actions Row */}
        <div className="flex items-center gap-3">
          {/* Wishlist */}
          <button
            onClick={async () => { 
              toggleWishlist(product.id); 
              const added = !inWishlist;
              toast.info(added ? 'Added to wishlist' : 'Removed from wishlist'); 
              if (added) {
                const { data: { session } } = await createClient().auth.getSession();
                if (!session) {
                  toast.info('Guest', 'Login to save your wishlist permanently');
                }
              }
            }}
            className={cn(
              'flex-1 h-12 rounded border flex items-center justify-center transition-all',
              inWishlist ? 'border-red-300 bg-red-50 text-red-500' : 'border-sage-light/50 text-charcoal hover:border-red-300 hover:text-red-500'
            )}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            id="product-wishlist-btn"
          >
            <Heart className="w-4 h-4 mr-2" fill={inWishlist ? 'currentColor' : 'none'} />
            <span className="text-sm font-medium">{inWishlist ? 'Saved' : 'Wishlist'}</span>
          </button>

          {/* Share */}
          <div className="flex-1">
            <ShareButton
              productId={product.id}
              productName={product.name}
              productPrice={currentPrice}
              className="w-full flex-1"
            />
          </div>
        </div>
      </div>

      {/* Stock warning */}
      {product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold && (
        <p className="text-sm text-orange-600 font-body">
          ⚠️ Only {product.stock_quantity} left in stock!
        </p>
      )}

      {/* USPs */}
      <div className="grid grid-cols-3 gap-3 py-4 border-y border-sage-light/20">
        {[
          { icon: Truck, label: 'Free Shipping', sub: 'Over ₹499' },
          { icon: RotateCcw, label: '15-Day Returns', sub: 'Easy returns' },
          { icon: Shield, label: '100% Organic', sub: 'Certified' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center text-center gap-1.5">
            <Icon className="w-5 h-5 text-sage-dark" />
            <p className="text-xs font-semibold text-charcoal font-body">{label}</p>
            <p className="text-[11px] text-charcoal-lighter font-body">{sub}</p>
          </div>
        ))}
      </div>

      {/* Delivery Check */}
      <div className="bg-sage-50 rounded-lg p-4">
        <p className="text-sm font-semibold text-charcoal mb-3 font-body flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sage-dark" />
          Check Delivery
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && checkDelivery()}
            placeholder="Enter 6-digit pincode"
            className="input flex-1 text-sm py-2"
            maxLength={6}
            id="delivery-pincode-input"
          />
          <button
            onClick={checkDelivery}
            disabled={checkingDelivery || pincode.length !== 6}
            className="btn-secondary py-2 px-4 text-sm"
            id="delivery-check-btn"
          >
            {checkingDelivery ? (
              <div className="w-4 h-4 border-2 border-sage-dark border-t-transparent rounded-full animate-spin" />
            ) : 'Check'}
          </button>
        </div>
        {deliveryInfo && (
          <p className={cn('text-sm mt-2 font-body', deliveryInfo.serviceable ? 'text-green-600' : 'text-red-500')}>
            {deliveryInfo.serviceable
              ? `✓ Delivery available via ${deliveryInfo.courier_name} in ${deliveryInfo.estimated_days} days`
              : '✗ Delivery not available to this pincode'}
          </p>
        )}
      </div>

      {/* Accordions: Description, Ingredients, How to Use */}
      {[
        { key: 'description', label: 'Product Description', content: product.description },
        { key: 'ingredients', label: 'Ingredients', content: product.ingredients },
        { key: 'how_to_use', label: 'How to Use', content: product.how_to_use },
      ].filter((s) => s.content).map((section) => (
        <div key={section.key} className="border-b border-sage-light/20">
          <button
            onClick={() => toggleSection(section.key)}
            className="w-full flex items-center justify-between py-4 text-left"
            aria-expanded={expandedSection === section.key}
          >
            <span className="font-body font-semibold text-charcoal text-sm">{section.label}</span>
            <ChevronDown
              className={cn('w-4 h-4 text-charcoal-lighter transition-transform', expandedSection === section.key && 'rotate-180')}
            />
          </button>
          {expandedSection === section.key && (
            <div
              className="pb-4 text-sm text-charcoal-light leading-relaxed font-body"
              dangerouslySetInnerHTML={{ __html: section.content! }}
            />
          )}
        </div>
      ))}

      {/* Tags */}
      {product.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span key={tag} className="badge badge-sage text-xs">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

