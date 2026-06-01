/**
 * store/wishlistStore.ts
 * Zustand wishlist store for LavishOrganic.
 * Persisted to localStorage. Synced with Supabase for logged-in users.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WishlistState {
  productIds: string[];
  isLoading: boolean;

  // Actions
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  syncFromServer: (productIds: string[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      isLoading: false,

      addToWishlist: (productId) => {
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds
            : [...state.productIds, productId],
        }));
      },

      removeFromWishlist: (productId) => {
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        }));
      },

      toggleWishlist: (productId) => {
        const { productIds, addToWishlist, removeFromWishlist } = get();
        if (productIds.includes(productId)) {
          removeFromWishlist(productId);
        } else {
          addToWishlist(productId);
        }
      },

      isInWishlist: (productId) => {
        return get().productIds.includes(productId);
      },

      clearWishlist: () => set({ productIds: [] }),

      syncFromServer: (productIds) => set({ productIds }),
    }),
    {
      name: 'lavishorganic-wishlist',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
