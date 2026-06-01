'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Tags, ShoppingCart, Users, Tag,
  Megaphone, BarChart3, Settings, Leaf, Star, Truck, X,
  CreditCard, Boxes, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  {
    label: 'Inventory',
    icon: Boxes,
    subItems: [
      { href: '/admin/inventory', label: 'Overview' },
      { href: '/admin/inventory/purchase-orders', label: 'Purchase Orders' },
      { href: '/admin/inventory/movements', label: 'Stock Movements' },
      { href: '/admin/inventory/reports', label: 'Reports' },
    ]
  },
  {
    label: 'Payments',
    icon: CreditCard,
    subItems: [
      { href: '/admin/payments', label: 'Overview' },
      { href: '/admin/payments/refunds', label: 'Refunds', badge: 'refunds' },
      { href: '/admin/payments/reports', label: 'Reports' },
    ]
  },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/offers', label: 'Offers', icon: Megaphone },
  { href: '/admin/influencers', label: 'Influencers', icon: Leaf, badge: 'influencers' },
  { href: '/admin/logistics', label: 'Logistics', icon: Truck },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isOpen = useUIStore((s) => s.adminSidebarOpen);
  const closeSidebar = useUIStore((s) => s.closeAdminSidebar);
  
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Inventory': false,
    'Payments': false
  });
  
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    // Check if current path requires a menu to be open
    NAV_ITEMS.forEach(item => {
      if (item.subItems && item.subItems.some(sub => pathname.startsWith(sub.href))) {
        setOpenMenus(prev => ({ ...prev, [item.label]: true }));
      }
    });

    // Fetch live badges
    const fetchBadges = async () => {
      try {
        const [payRes, infRes] = await Promise.all([
          fetch('/api/admin/payments?type=refund_pending'),
          // Use client supabase to get pending influencers
          import('@/lib/supabase/client').then(m => m.createClient().from('influencer_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'))
        ]);
        
        const payData = await payRes.json();
        
        setBadges({ 
          refunds: payData.total || 0,
          influencers: infRes.count || 0
        });
      } catch (e) {}
    };
    fetchBadges();
    // Poll every 60s
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-warm-white border-r border-sage-light/30 flex flex-col h-screen overflow-y-auto transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-60 lg:flex-shrink-0",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sage-light/20">
        <div className="flex items-center gap-2.5">
          <Image
            src="https://res.cloudinary.com/dtrin6lwv/image/upload/v1780070716/a2ecfeef-39b1-4dbd-9245-f43f8529fb41_nsnzp6.png"
            alt="LavishOrganic Admin"
            width={120}
            height={32}
            className="object-contain w-auto h-6"
            priority
          />
          <div>
            <p className="text-[10px] text-charcoal-lighter font-body">Admin Panel</p>
          </div>
        </div>
        <button onClick={closeSidebar} className="lg:hidden text-charcoal-lighter hover:text-charcoal p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => {
          if (item.subItems) {
            const isMenuOpen = openMenus[item.label];
            const hasActiveSub = item.subItems.some(sub => pathname.startsWith(sub.href) && sub.href !== '/admin/inventory' && sub.href !== '/admin/payments');
            
            return (
              <div key={item.label} className="mb-1">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group',
                    hasActiveSub || pathname === item.subItems[0].href
                      ? 'bg-sage-50 text-sage-dark'
                      : 'text-charcoal-lighter hover:bg-sage-50/50 hover:text-charcoal'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </div>
                  {isMenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                
                {isMenuOpen && (
                  <div className="mt-1 ml-6 space-y-0.5 border-l-2 border-sage-light/20 pl-2">
                    {item.subItems.map(sub => {
                      const isSubActive = pathname === sub.href;
                      const badgeCount = sub.badge ? badges[sub.badge] : 0;
                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          onClick={closeSidebar}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                            isSubActive
                              ? 'text-sage-dark bg-sage-50/50'
                              : 'text-charcoal-lighter hover:text-charcoal hover:bg-sage-50/30'
                          )}
                        >
                          {sub.label}
                          {badgeCount > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                              {badgeCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
          
          const badgeCount = item.badge ? badges[item.badge] : 0;

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={closeSidebar}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group',
                isActive
                  ? 'bg-sage-50 text-sage-dark'
                  : 'text-charcoal-lighter hover:bg-sage-50/50 hover:text-charcoal'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-sage-dark" : "text-charcoal-lighter group-hover:text-charcoal"
                )} />
                {item.label}
              </div>
              {badgeCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sage-light/20">
        <Link href="/" target="_blank"
          className="text-xs text-charcoal-lighter hover:text-sage-dark transition-colors font-body">
          View Store →
        </Link>
      </div>
    </aside>
    </>
  );
}
