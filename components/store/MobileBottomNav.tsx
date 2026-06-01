'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openSearch } = useUIStore();
  const { totals, openCart } = useCartStore();

  const NAV_ITEMS = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Search', icon: Search, onClick: openSearch },
    { label: 'Cart', icon: ShoppingBag, onClick: openCart, badge: totals.item_count },
    { label: 'Profile', icon: User, href: '/account' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-sage-light/30 pb-safe z-40 md:hidden">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href && pathname === item.href;
          const content = (
            <>
              <div className="relative">
                <item.icon
                  className={cn(
                    'w-6 h-6 mb-1 transition-colors',
                    isActive ? 'text-sage-dark' : 'text-charcoal-lighter'
                  )}
                />
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 bg-sage-dark text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium font-body transition-colors',
                  isActive ? 'text-sage-dark' : 'text-charcoal-lighter'
                )}
              >
                {item.label}
              </span>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center w-full h-full"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex flex-col items-center justify-center w-full h-full"
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
