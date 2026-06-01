/**
 * store/uiStore.ts
 * Zustand UI state store.
 * Manages global UI state: modals, search, toasts, filters.
 */

import { create } from 'zustand';
import type { Toast, ProductFilters, AppNotification } from '@/types';

interface UIState {
  // Modals & drawers
  searchModalOpen: boolean;
  mobileMenuOpen: boolean;
  adminSidebarOpen: boolean;

  // Toast notifications
  toasts: Toast[];
  notificationToasts: AppNotification[];

  // Active product filters (for shop page URL sync)
  filters: ProductFilters;

  // Actions
  openSearch: () => void;
  closeSearch: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleAdminSidebar: () => void;
  closeAdminSidebar: () => void;

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  addNotificationToast: (notification: AppNotification) => void;
  removeNotificationToast: (id: string) => void;

  // Filter actions
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearFilters: () => void;
}

const DEFAULT_FILTERS: ProductFilters = {
  sort: 'newest',
  page: 1,
  limit: 24,
};

export const useUIStore = create<UIState>()((set, get) => ({
  searchModalOpen: false,
  mobileMenuOpen: false,
  adminSidebarOpen: false,
  toasts: [],
  notificationToasts: [],
  filters: DEFAULT_FILTERS,

  openSearch: () => set({ searchModalOpen: true }),
  closeSearch: () => set({ searchModalOpen: false }),

  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),

  toggleAdminSidebar: () =>
    set((state) => ({ adminSidebarOpen: !state.adminSidebarOpen })),
  closeAdminSidebar: () => set({ adminSidebarOpen: false }),

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast: Toast = { ...toast, id, duration: toast.duration ?? 4000 };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove after duration
    setTimeout(() => {
      get().removeToast(id);
    }, newToast.duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  addNotificationToast: (notification) => {
    set((state) => ({ notificationToasts: [...state.notificationToasts, notification] }));
    setTimeout(() => {
      get().removeNotificationToast(notification.id);
    }, 6000);
  },

  removeNotificationToast: (id) => {
    set((state) => ({
      notificationToasts: state.notificationToasts.filter((n) => n.id !== id),
    }));
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters, page: 1 }, // reset page on filter change
    }));
  },

  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
}));

// ============================================================
// CONVENIENCE HOOKS
// ============================================================

/**
 * Hook to show success toast.
 */
export function useToast() {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
  };
}
