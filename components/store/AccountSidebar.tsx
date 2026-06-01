'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, Heart, MapPin, ChevronRight, TrendingUp, Bell } from 'lucide-react';
import { LogoutButton } from '@/components/store/LogoutButton';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface AccountSidebarProps {
  profile: any;
  userEmail: string;
  isInfluencer?: boolean;
}

const NAV_LINKS = [
  { href: '/account/edit', label: 'My Profile', icon: User, exact: false },
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/notifications', label: 'Notifications', icon: Bell, exact: true },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
];

export function AccountSidebar({ profile, userEmail, isInfluencer }: AccountSidebarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/notifications/count')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUnreadCount(data.data.unread);
      })
      .catch(console.error);
  }, []);
  
  // On mobile, if we are NOT on the root /account page, hide the sidebar
  const isRoot = pathname === '/account';

  const dynamicLinks = [...NAV_LINKS];
  if (isInfluencer) {
    dynamicLinks.unshift({ href: '/influencer/dashboard', label: 'Partner Dashboard', icon: TrendingUp, exact: false });
  }

  return (
    <aside className={cn("lg:col-span-1", !isRoot && "hidden lg:block")}>
      <div className="card p-5 mb-4 border-sage-light/20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center text-sage-dark font-display font-bold text-xl">
            {(profile?.full_name ?? userEmail ?? 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-charcoal font-display text-lg">{profile?.full_name ?? 'Customer'}</p>
            <p className="text-xs text-charcoal-lighter mt-0.5">{userEmail}</p>
          </div>
        </div>
      </div>
      <nav className="card overflow-hidden border-sage-light/20 shadow-sm">
        {dynamicLinks.map((link) => {
          const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center justify-between px-5 py-4 text-sm font-medium transition-colors border-b border-sage-light/20 last:border-0",
                isActive ? "bg-sage-50 text-sage-dark border-l-4 border-l-sage-dark" : "text-charcoal hover:bg-sage-50 border-l-4 border-l-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <link.icon className={cn("w-4.5 h-4.5", isActive ? "text-sage-dark" : "text-charcoal-lighter")} />
                {link.label}
                {link.href === '/account/notifications' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto">
                    {unreadCount}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-charcoal-lighter/50" />
            </Link>
          );
        })}
        <div className="px-5 py-4">
          <LogoutButton />
        </div>
      </nav>
    </aside>
  );
}

export function MobileAccountHeader() {
  const pathname = usePathname();
  const isRoot = pathname === '/account';

  if (isRoot) return null;

  const currentLink = NAV_LINKS.find(link => link.href === pathname) || (pathname.includes('/influencer/dashboard') ? { label: 'Partner Dashboard' } : null);

  return (
    <div className="lg:hidden mb-4 flex items-center gap-3">
      <Link href="/account" className="p-2 -ml-2 text-charcoal-lighter hover:text-charcoal bg-white rounded-full shadow-sm border border-sage-light/20">
        <ChevronRight className="w-5 h-5 rotate-180" />
      </Link>
      <h1 className="font-display text-xl font-medium text-charcoal">
        {currentLink?.label ?? 'Account'}
      </h1>
    </div>
  );
}
