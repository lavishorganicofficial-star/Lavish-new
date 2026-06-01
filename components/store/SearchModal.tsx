'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, ArrowRight, Package } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency } from '@/lib/utils';
import { trackSearch } from '@/lib/analytics';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  category_name: string | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchModal() {
  const { searchModalOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 350);

  // Focus input on open
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('');
      setResults([]);
    }
  }, [searchModalOpen]);

  // Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    if (searchModalOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [searchModalOpen, closeSearch]);

  // Search products
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`
        );
        const data = await res.json();
        if (data.success) {
          const resultList = data.data.data ?? [];
          setResults(resultList);
          // Track search
          trackSearch(debouncedQuery, resultList.length);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const TRENDING = [
    { label: 'Vitamin C Serum', href: '/shop/rose-glow-vitamin-c-face-serum' },
    { label: 'Neem Face Wash', href: '/shop/neem-turmeric-purifying-face-wash' },
    { label: 'Hair Oil', href: '/shop/bhringraj-amla-ayurvedic-hair-oil' },
    { label: 'Body Scrub', href: '/shop/arabica-coffee-exfoliating-body-scrub' },
  ];

  return (
    <AnimatePresence>
      {searchModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
          onClick={(e) => e.target === e.currentTarget && closeSearch()}
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="w-full max-w-2xl bg-warm-white rounded-xl shadow-warm-xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-sage-light/30">
              <Search className="w-5 h-5 text-charcoal-lighter flex-shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search organic products..."
                className="flex-1 bg-transparent text-charcoal text-base placeholder-charcoal-lighter outline-none font-body"
                id="search-modal-input"
                autoComplete="off"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-charcoal-lighter hover:text-charcoal transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={closeSearch}
                className="text-charcoal-lighter hover:text-charcoal transition-colors ml-2"
                aria-label="Close search"
              >
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-sage-50 border border-sage-light/30 rounded text-charcoal-lighter">
                  ESC
                </kbd>
              </button>
            </div>

            {/* Results / Suggestions */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="px-5 py-8 flex items-center justify-center gap-2 text-charcoal-lighter text-sm">
                  <div className="w-4 h-4 border-2 border-sage border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  <p className="px-5 py-2 text-xs font-medium text-charcoal-lighter uppercase tracking-wider">
                    Products
                  </p>
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={`/shop/${result.slug}`}
                      onClick={closeSearch}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-sage-50 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-sage-50 flex-shrink-0">
                        {result.image_url ? (
                          <Image
                            src={result.image_url}
                            alt={result.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-sage-light" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal group-hover:text-sage-dark transition-colors line-clamp-1">
                          {result.name}
                        </p>
                        {result.category_name && (
                          <p className="text-xs text-charcoal-lighter">{result.category_name}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-charcoal">
                          {formatCurrency(result.price)}
                        </p>
                        {result.compare_price && result.compare_price > result.price && (
                          <p className="text-xs text-charcoal-lighter line-through">
                            {formatCurrency(result.compare_price)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}

                  <div className="px-5 py-3 border-t border-sage-light/20">
                    <Link
                      href={`/shop?search=${encodeURIComponent(query)}`}
                      onClick={closeSearch}
                      className="flex items-center gap-2 text-sm text-sage-dark font-medium hover:gap-3 transition-all"
                    >
                      See all results for &quot;{query}&quot;
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : query.length >= 2 ? (
                <div className="px-5 py-8 text-center text-charcoal-lighter text-sm">
                  No products found for &quot;{query}&quot;
                </div>
              ) : (
                /* Trending searches */
                <div className="py-4 px-5">
                  <p className="text-xs font-medium text-charcoal-lighter uppercase tracking-wider mb-3">
                    Trending
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSearch}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sage-50 text-charcoal-light text-sm rounded-full hover:bg-sage-100 hover:text-sage-dark transition-colors"
                      >
                        <Search className="w-3 h-3" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
