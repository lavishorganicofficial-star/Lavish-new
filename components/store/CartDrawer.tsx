'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import { trackRemoveCart } from '@/lib/analytics';

export function CartDrawer() {
  const { items, totals, isOpen, closeCart, removeItem, updateQuantity } =
    useCartStore();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-40"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-warm-white shadow-warm-xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-sage-light/30">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-sage-dark" />
                <h2 className="font-display text-xl font-medium text-charcoal">
                  Your Cart
                </h2>
                {totals.item_count > 0 && (
                  <span className="badge badge-sage">{totals.item_count}</span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="btn-icon"
                aria-label="Close cart"
                id="cart-drawer-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Empty State */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-12">
                <div className="w-20 h-20 bg-sage-50 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-sage-light" />
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-charcoal font-medium">
                    Your cart is empty
                  </p>
                  <p className="text-sm text-charcoal-lighter mt-1">
                    Discover our organic collection
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="btn-primary"
                  id="cart-drawer-shop-btn"
                >
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                {/* Free shipping progress */}
                <div className="px-6 py-3 bg-sage-50 border-b border-sage-light/20">
                  {totals.shipping_amount === 0 ? (
                    <p className="text-xs text-sage-dark font-medium text-center">
                      🎉 You qualify for <strong>FREE shipping!</strong>
                    </p>
                  ) : (
                    <div>
                      <p className="text-xs text-charcoal-lighter text-center mb-2">
                        Add{' '}
                        <span className="font-semibold text-sage-dark">
                          {formatCurrency(
                            parseFloat(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD ?? '499') -
                              totals.subtotal
                          )}
                        </span>{' '}
                        more for FREE shipping
                      </p>
                      <div className="h-1 bg-sage-light/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sage-dark rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              (totals.subtotal /
                                parseFloat(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD ?? '499')) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={`${item.product_id}-${item.variant_id}`}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-4 pb-4 border-b border-sage-light/20 last:border-0"
                      >
                        {/* Product Image */}
                        <Link
                          href={`/shop/${item.product.slug}`}
                          onClick={closeCart}
                          className="flex-shrink-0 w-20 h-24 rounded-md overflow-hidden bg-sage-50"
                        >
                          <Image
                            src={
                              item.product.images?.[0]?.url ??
                              '/placeholder-product.jpg'
                            }
                            alt={item.product.name}
                            width={80}
                            height={96}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/shop/${item.product.slug}`}
                            onClick={closeCart}
                            className="font-body text-sm font-medium text-charcoal hover:text-sage-dark transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          {item.variant && (
                            <p className="text-xs text-charcoal-lighter mt-0.5">
                              {item.variant.name}: {item.variant.value}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            {/* Quantity */}
                            <div className="flex items-center gap-1 bg-sage-50 rounded-md p-0.5">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product_id,
                                    item.variant_id,
                                    item.quantity - 1
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center hover:bg-white rounded transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product_id,
                                    item.variant_id,
                                    item.quantity + 1
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center hover:bg-white rounded transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Price & Remove */}
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-charcoal">
                                {formatCurrency(item.total_price)}
                              </span>
                              <button
                                onClick={() => {
                                  removeItem(item.product_id, item.variant_id);
                                  trackRemoveCart(item.product_id);
                                }}
                                className="w-7 h-7 flex items-center justify-center text-charcoal-lighter hover:text-red-500 transition-colors"
                                aria-label={`Remove ${item.product.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Summary & CTA */}
                <div className="border-t border-sage-light/30 px-6 py-5 space-y-3 bg-warm-white">
                  <div className="flex items-center justify-between text-sm text-charcoal-lighter">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.discount_amount > 0 && (
                    <div className="flex items-center justify-between text-sm text-sage-dark">
                      <span>Discount</span>
                      <span>-{formatCurrency(totals.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-charcoal-lighter">
                    <span>Shipping</span>
                    <span>
                      {totals.shipping_amount === 0 ? (
                        <span className="text-sage-dark font-medium">FREE</span>
                      ) : (
                        formatCurrency(totals.shipping_amount)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-charcoal border-t border-sage-light/30 pt-3">
                    <span className="font-body">Total</span>
                    <span className="text-lg">{formatCurrency(totals.total)}</span>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="btn-primary w-full justify-center text-base py-4 mt-2"
                    id="cart-drawer-checkout-btn"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="btn-ghost w-full justify-center text-sm"
                    id="cart-drawer-view-cart-btn"
                  >
                    View Full Cart
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
