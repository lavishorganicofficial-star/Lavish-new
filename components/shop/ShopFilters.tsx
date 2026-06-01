'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Category { id: string; name: string; slug: string; }

interface ShopFiltersProps {
  categories: Category[];
  activeCategory?: string;
  sort: string;
  minPrice?: string;
  maxPrice?: string;
  inStock: boolean;
  mobile?: boolean;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'bestselling', label: 'Bestselling' },
];

export function ShopFilters({
  categories, activeCategory, sort, minPrice, maxPrice, inStock, mobile = false,
}: ShopFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minPrice ?? '');
  const [localMax, setLocalMax] = useState(maxPrice ?? '');

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.set('page', '1');
      router.push(`/shop?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => {
    router.push('/shop');
    setLocalMin('');
    setLocalMax('');
  };

  const hasActiveFilters = activeCategory || minPrice || maxPrice || inStock;

  const filtersContent = (
    <div className="space-y-6">
      {/* Clear button */}
      {hasActiveFilters && (
        <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-body">
          <X className="w-3.5 h-3.5" />
          Clear all filters
        </button>
      )}

      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal mb-3 font-body uppercase tracking-wide">Sort By</h3>
        <div className="space-y-2">
          {SORT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={sort === opt.value}
                onChange={() => updateFilter('sort', opt.value)}
                className="accent-sage-dark"
              />
              <span className="text-sm text-charcoal-light group-hover:text-charcoal transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-charcoal mb-3 font-body uppercase tracking-wide">Category</h3>
          <div className="space-y-1.5">
            <button
              onClick={() => updateFilter('category', null)}
              className={cn(
                'w-full text-left text-sm px-2 py-1.5 rounded transition-colors',
                !activeCategory ? 'bg-sage-50 text-sage-dark font-medium' : 'text-charcoal-light hover:text-charcoal'
              )}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateFilter('category', cat.slug)}
                className={cn(
                  'w-full text-left text-sm px-2 py-1.5 rounded transition-colors',
                  activeCategory === cat.slug
                    ? 'bg-sage-50 text-sage-dark font-medium'
                    : 'text-charcoal-light hover:text-charcoal'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal mb-3 font-body uppercase tracking-wide">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            onBlur={() => updateFilter('min_price', localMin || null)}
            placeholder="Min"
            className="w-full input text-sm py-2"
            min={0}
          />
          <span className="text-charcoal-lighter text-sm">—</span>
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            onBlur={() => updateFilter('max_price', localMax || null)}
            placeholder="Max"
            className="w-full input text-sm py-2"
            min={0}
          />
        </div>
      </div>

      {/* In Stock */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateFilter('in_stock', e.target.checked ? 'true' : null)}
            className="w-4 h-4 accent-sage-dark rounded"
          />
          <span className="text-sm text-charcoal font-body">In Stock Only</span>
        </label>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-sage-light/50 rounded text-sm font-body text-charcoal hover:border-sage-dark transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters {hasActiveFilters ? `(active)` : ''}
        </button>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-charcoal/40" onClick={() => setMobileOpen(false)} />
            <div className="relative ml-auto w-80 bg-warm-white h-full overflow-y-auto p-6 shadow-warm-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-medium">Filters</h2>
                <button onClick={() => setMobileOpen(false)} className="btn-icon">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {filtersContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return <div>{filtersContent}</div>;
}
