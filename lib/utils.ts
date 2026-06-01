/**
 * lib/utils.ts
 * Shared utility functions for LavishOrganic.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================
// CLASSNAME UTILITY
// ============================================================

/**
 * Merges Tailwind CSS class names intelligently.
 * Resolves conflicts (e.g., bg-red-500 + bg-blue-500 → bg-blue-500).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================
// CURRENCY & NUMBER FORMATTING
// ============================================================

/**
 * Formats a number as Indian Rupees.
 * @example formatCurrency(1299.5) → "₹1,299.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number in Indian numbering system.
 * @example formatNumber(1500000) → "15,00,000"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Converts rupees to paise (for Razorpay).
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Converts paise to rupees (from Razorpay).
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

// ============================================================
// DISCOUNT CALCULATIONS
// ============================================================

/**
 * Calculates discount percentage between two prices.
 * @example calculateDiscountPercentage(1299, 799) → 38
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  salePrice: number
): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Calculates free shipping status.
 */
export function calculateShipping(subtotal: number): number {
  const threshold = parseFloat(process.env.FREE_SHIPPING_THRESHOLD ?? '499');
  const flatRate = parseFloat(process.env.FLAT_SHIPPING_RATE ?? '49');
  return subtotal >= threshold ? 0 : flatRate;
}

// ============================================================
// STRING UTILITIES
// ============================================================

/**
 * Generates a URL-friendly slug from a string.
 * @example generateSlug("Rose Glow Vitamin C Serum") → "rose-glow-vitamin-c-serum"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncates text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Capitalizes the first letter of each word.
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generates a random referral code (6 chars, uppercase alphanumeric).
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid ambiguous chars (0, O, I, 1)
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

// ============================================================
// DATE UTILITIES
// ============================================================

/**
 * Formats a date string for display.
 * @example formatDate("2025-05-29T12:00:00Z") → "29 May 2025"
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats a date with time.
 * @example formatDateTime("2025-05-29T12:00:00Z") → "29 May 2025, 5:30 PM"
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns relative time string.
 * @example timeAgo("2025-05-28T12:00:00Z") → "1 day ago"
 */
export function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
    [1, 'second'],
  ];

  for (const [seconds_per, label] of intervals) {
    const count = Math.floor(seconds / seconds_per);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

/**
 * Checks if a date is in the future (for offer validity).
 */
export function isFuture(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) > new Date();
}

/**
 * Checks if a date is in the past (for offer expiry).
 */
export function isPast(dateStr: string | null): boolean {
  if (!dateStr) return true; // no expiry = never expires
  return new Date(dateStr) < new Date();
}

// ============================================================
// VALIDATION UTILITIES
// ============================================================

/**
 * Validates Indian mobile number (10 digits, starts with 6-9).
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

/**
 * Validates Indian pincode (6 digits).
 */
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

/**
 * Validates GSTIN format.
 * Format: 2-digit state code + PAN + 1-digit entity count + Z + check digit
 */
export function isValidGSTIN(gstin: string): boolean {
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(gstin);
}

// ============================================================
// ARRAY UTILITIES
// ============================================================

/**
 * Groups an array by a key function.
 */
export function groupBy<T, K extends string>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

/**
 * Removes duplicate values from an array.
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

// ============================================================
// IMAGE UTILITIES
// ============================================================

/**
 * Returns a placeholder image URL for missing product images.
 */
export function getPlaceholderImage(width = 400, height = 500): string {
  return `https://placehold.co/${width}x${height}/A8BDA3/4A6741?text=LavishOrganic&font=playfair`;
}

/**
 * Extracts the primary image URL from a product's images array.
 */
export function getPrimaryImageUrl(
  images?: { url: string; is_primary: boolean }[]
): string {
  if (!images || images.length === 0) return getPlaceholderImage();
  const primary = images.find((img) => img.is_primary);
  return primary?.url ?? images[0]?.url ?? getPlaceholderImage();
}

// ============================================================
// ORDER UTILITIES
// ============================================================

/**
 * Maps order status to a human-readable label and color.
 */
export function getOrderStatusInfo(status: string): {
  label: string;
  color: string;
  bgColor: string;
} {
  const map: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    awaiting_cod_confirmation: { label: 'COD Pending', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    processing: { label: 'Processing', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    packed: { label: 'Packed', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    shipped: { label: 'Shipped', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    out_for_delivery: { label: 'Out for Delivery', color: 'text-teal-700', bgColor: 'bg-teal-100' },
    delivered: { label: 'Delivered', color: 'text-green-700', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
    returned: { label: 'Returned', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    refunded: { label: 'Refunded', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  };
  return map[status] ?? { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
}

/**
 * Returns the next valid statuses for an order (for admin status update dropdown).
 */
export function getNextOrderStatuses(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    awaiting_cod_confirmation: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['packed', 'cancelled'],
    packed: ['shipped'],
    shipped: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: ['returned'],
    returned: ['refunded'],
  };
  return transitions[currentStatus] ?? [];
}
