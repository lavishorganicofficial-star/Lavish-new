/**
 * store/cartStore.ts
 * Zustand cart store for LavishOrganic.
 *
 * Manages cart state client-side with localStorage persistence.
 * Syncs with Supabase `cart_items` table for logged-in users.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CartItemWithProduct,
  CartTotals,
  ProductListItem,
  ProductVariant,
  CouponValidationResult,
} from '@/types';
import { calculateShipping } from '@/lib/utils';

interface CartState {
  items: CartItemWithProduct[];
  coupon: CouponValidationResult | null;
  isOpen: boolean;
  isLoading: boolean;

  // Computed totals
  totals: CartTotals;

  // Actions
  addItem: (
    product: ProductListItem,
    variant: ProductVariant | null,
    quantity?: number
  ) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (
    productId: string,
    variantId: string | null,
    quantity: number
  ) => void;
  applyCoupon: (coupon: CouponValidationResult) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Server sync
  syncFromServer: (serverItems: CartItemWithProduct[]) => void;
}

/**
 * Computes cart totals from items and coupon.
 */
function computeTotals(
  items: CartItemWithProduct[],
  coupon: CouponValidationResult | null
): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const discount_amount = coupon?.valid ? coupon.discount_amount : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount_amount);
  const shipping_amount = calculateShipping(discountedSubtotal);

  // GST is included in product price (18% inclusive)
  // We show it extracted for transparency
  const gst_rate = 0.18;
  const tax_amount =
    Math.round(discountedSubtotal * (gst_rate / (1 + gst_rate)) * 100) / 100;

  const total =
    Math.round((discountedSubtotal + shipping_amount) * 100) / 100;

  const item_count = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(discount_amount * 100) / 100,
    shipping_amount,
    tax_amount,
    total,
    item_count,
  };
}

/**
 * Gets the price for a product+variant combination.
 */
function getUnitPrice(
  product: ProductListItem,
  variant: ProductVariant | null
): number {
  const modifier = variant?.price_modifier ?? 0;
  return product.price + modifier;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      isOpen: false,
      isLoading: false,
      totals: {
        subtotal: 0,
        discount_amount: 0,
        shipping_amount: 0,
        tax_amount: 0,
        total: 0,
        item_count: 0,
      },

      addItem: (product, variant, quantity = 1) => {
        set((state) => {
          const productId = product.id;
          const variantId = variant?.id ?? null;

          const existingIndex = state.items.findIndex(
            (item) =>
              item.product_id === productId && item.variant_id === variantId
          );

          let newItems: CartItemWithProduct[];

          if (existingIndex >= 0) {
            // Update quantity
            newItems = state.items.map((item, index) => {
              if (index !== existingIndex) return item;
              const newQty = item.quantity + quantity;
              const unitPrice = getUnitPrice(product, variant);
              return {
                ...item,
                quantity: newQty,
                total_price: Math.round(unitPrice * newQty * 100) / 100,
              };
            });
          } else {
            // Add new item
            const unitPrice = getUnitPrice(product, variant);
            const newItem: CartItemWithProduct = {
              product_id: productId,
              variant_id: variantId,
              quantity,
              product,
              variant,
              unit_price: unitPrice,
              total_price: Math.round(unitPrice * quantity * 100) / 100,
            };
            newItems = [...state.items, newItem];
          }

          return {
            items: newItems,
            totals: computeTotals(newItems, state.coupon),
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => {
          const newItems = state.items.filter(
            (item) =>
              !(item.product_id === productId && item.variant_id === variantId)
          );
          return {
            items: newItems,
            totals: computeTotals(newItems, state.coupon),
          };
        });
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => {
          const newItems = state.items.map((item) => {
            if (item.product_id !== productId || item.variant_id !== variantId) {
              return item;
            }
            return {
              ...item,
              quantity,
              total_price:
                Math.round(item.unit_price * quantity * 100) / 100,
            };
          });
          return {
            items: newItems,
            totals: computeTotals(newItems, state.coupon),
          };
        });
      },

      applyCoupon: (coupon) => {
        set((state) => ({
          coupon,
          totals: computeTotals(state.items, coupon),
        }));
      },

      removeCoupon: () => {
        set((state) => ({
          coupon: null,
          totals: computeTotals(state.items, null),
        }));
      },

      clearCart: () => {
        set({
          items: [],
          coupon: null,
          totals: {
            subtotal: 0,
            discount_amount: 0,
            shipping_amount: 0,
            tax_amount: 0,
            total: 0,
            item_count: 0,
          },
        });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      syncFromServer: (serverItems) => {
        set((state) => ({
          items: serverItems,
          totals: computeTotals(serverItems, state.coupon),
        }));
      },
    }),
    {
      name: 'lavishorganic-cart',
      storage: createJSONStorage(() => localStorage),
      // Only persist cart items and coupon, not UI state
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon,
      }),
      // ✅ CRITICAL: Recompute totals after hydration from localStorage
      // Without this, totals stays at the initial {subtotal:0,...} even though items are restored
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.totals = computeTotals(state.items, state.coupon);
        }
      },
    }
  )
);
