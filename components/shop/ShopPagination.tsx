'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShopPaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export function ShopPagination({ currentPage, totalPages, searchParams }: ShopPaginationProps) {
  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, val]) => {
      if (key !== 'page' && val) params.set(key, val);
    });
    params.set('page', page.toString());
    return `/shop?${params.toString()}`;
  };

  // Show pages around current: [1] ... [4] [5*] [6] ... [12]
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Shop pagination">
      {/* Prev */}
      <Link
        href={buildHref(currentPage - 1)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded text-sm font-body transition-colors',
          currentPage === 1
            ? 'pointer-events-none opacity-40 text-charcoal-lighter'
            : 'text-charcoal hover:bg-sage-50 hover:text-sage-dark'
        )}
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
        Prev
      </Link>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="px-2 py-2 text-charcoal-lighter text-sm">…</span>
        ) : (
          <Link
            key={page}
            href={buildHref(page as number)}
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded text-sm font-body transition-colors',
              currentPage === page
                ? 'bg-sage-dark text-white font-medium'
                : 'text-charcoal hover:bg-sage-50 hover:text-sage-dark'
            )}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      <Link
        href={buildHref(currentPage + 1)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded text-sm font-body transition-colors',
          currentPage === totalPages
            ? 'pointer-events-none opacity-40 text-charcoal-lighter'
            : 'text-charcoal hover:bg-sage-50 hover:text-sage-dark'
        )}
        aria-disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Link>
    </nav>
  );
}
