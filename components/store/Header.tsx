'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUIStore } from '@/store/uiStore';
import { ShoppingBag, Heart, Search, Menu, X, Leaf, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { AnnouncementBar } from './AnnouncementBar';
import { NotificationBell } from './NotificationBell';

const NAV_LINKS = [
  { href: '/shop', label: 'Shop All' },
  { href: '/category/face-care', label: 'Face Care' },
  { href: '/category/body-care', label: 'Body Care' },
  { href: '/category/hair-care', label: 'Hair Care' },
  { href: '/category/wellness', label: 'Wellness' },
  { href: '/offers', label: 'Offers' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.totals.item_count);
  const openCart = useCartStore((s) => s.openCart);
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const { openSearch, mobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useUIStore();


  const [role, setRole] = useState<'customer' | 'influencer' | 'admin' | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Fetch role for smart account link
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data) setRole(data.role as any);
      }
    };
    fetchUser();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const accountUrl = role === 'influencer' ? '/influencer/dashboard' : role === 'admin' ? '/admin' : '/account';

  return (
    <>
      <AnnouncementBar />
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'glass border-b border-sage-light/30 shadow-warm-sm'
            : 'bg-warm-white border-b border-sage-light/20'
        )}
      >
        <div className="container">
          <div className="flex items-center justify-between h-[var(--header-height)]">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="LavishOrganic Home"
            >
              <Image
                src="https://res.cloudinary.com/dtrin6lwv/image/upload/v1780070716/a2ecfeef-39b1-4dbd-9245-f43f8529fb41_nsnzp6.png"
                alt="LavishOrganic Logo"
                width={200}
                height={102}
                className="w-28 sm:w-36 h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-sm font-medium text-charcoal-light hover:text-sage-dark transition-colors duration-150 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-sage-dark transition-all duration-250 group-hover:w-full rounded-full" />
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={openSearch}
                className="btn-icon"
                aria-label="Search products"
                id="header-search-btn"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="btn-icon relative"
                aria-label={`Wishlist (${mounted ? wishlistCount : 0} items)`}
                id="header-wishlist-btn"
              >
                <Heart className="w-5 h-5" />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-sage-dark text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <NotificationBell />

              {/* Cart */}
              <button
                onClick={openCart}
                className="btn-icon relative"
                aria-label={`Cart (${mounted ? cartCount : 0} items)`}
                id="header-cart-btn"
              >
                <ShoppingBag className="w-5 h-5" />
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-sage-dark text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>

              {/* Account */}
              <Link
                href={accountUrl}
                className="hidden sm:flex btn-ghost text-sm ml-1 gap-2 items-center"
                id="header-account-btn"
              >
                <User className="w-4 h-4" />
                {role === 'influencer' ? 'Partner Portal' : 'Account'}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMobileMenu}
                className="btn-icon lg:hidden ml-1"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                id="header-menu-btn"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-sage-light/30 bg-warm-white animate-fade-in-down">
            <nav className="container py-4 flex flex-col gap-1" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="px-3 py-3 font-body text-sm font-medium text-charcoal hover:bg-sage-50 hover:text-sage-dark rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="divider" />
              <Link
                href={accountUrl}
                onClick={closeMobileMenu}
                className="px-3 py-3 font-body text-sm font-medium text-charcoal hover:bg-sage-50 hover:text-sage-dark rounded-md transition-colors"
              >
                {role === 'influencer' ? 'Partner Portal' : 'My Account'}
              </Link>
              <Link
                href="/influencer"
                onClick={closeMobileMenu}
                className="px-3 py-3 font-body text-sm font-medium text-earth hover:bg-gold/10 rounded-md transition-colors"
              >
                ✨ Become an Influencer
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
