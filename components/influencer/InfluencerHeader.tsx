'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Menu, X, User as UserIcon, LogOut, ExternalLink, Settings, LayoutDashboard, DollarSign, Link as LinkIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const NAV_LINKS = [
  { href: '/influencer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/influencer/dashboard/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/influencer/dashboard/links', label: 'My Links', icon: LinkIcon },
];

export function InfluencerHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const [profile, setProfile] = useState<{ full_name: string; instagram_handle: string | null } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        const { data: ip } = await supabase.from('influencer_profiles').select('instagram_handle').eq('id', user.id).single();
        if (p) {
          setProfile({
            full_name: p.full_name || 'Partner',
            instagram_handle: ip?.instagram_handle || null
          });
        }
      }
    }
    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/influencer/login');
    router.refresh();
  };

  const getFirstName = () => profile?.full_name?.split(' ')[0] || 'Partner';

  return (
    <header className="bg-white border-b border-sage-light/30 sticky top-0 z-50 shadow-sm">
      <div className="container max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <Link href="/influencer/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sage-dark rounded-full flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-display text-lg font-semibold text-charcoal leading-none block">LavishOrganic</span>
              <span className="text-[10px] uppercase tracking-wider text-sage-dark font-bold leading-none">Partner Portal</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    isActive 
                      ? "bg-sage-light/20 text-sage-dark" 
                      : "text-charcoal-lighter hover:text-charcoal hover:bg-warm-white"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: User Menu (Desktop) & Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* Desktop User Menu Toggle */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-sage-light/40 hover:bg-warm-white transition-colors"
            >
              <div className="w-7 h-7 bg-sage-light/30 rounded-full flex items-center justify-center text-sage-dark">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-charcoal">Hi, {getFirstName()}</span>
            </button>

            {/* Desktop Dropdown */}
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-sage-light/20 z-50 overflow-hidden">
                  <div className="p-4 border-b border-sage-light/20 bg-warm-white/50">
                    <p className="font-semibold text-charcoal">{profile?.full_name}</p>
                    {profile?.instagram_handle && (
                      <p className="text-xs text-charcoal-lighter mt-0.5">@{profile.instagram_handle}</p>
                    )}
                  </div>
                  <div className="p-2">
                    <Link href="/influencer/dashboard/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-warm-white rounded-lg transition-colors">
                      <UserIcon className="w-4 h-4 text-charcoal-lighter" /> My Profile
                    </Link>
                    <Link href="/influencer/dashboard/profile?tab=payout" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-warm-white rounded-lg transition-colors">
                      <Settings className="w-4 h-4 text-charcoal-lighter" /> Payout Settings
                    </Link>
                  </div>
                  <div className="p-2 border-t border-sage-light/20">
                    <a href="/" target="_blank" rel="noopener noreferrer" onClick={() => setIsUserMenuOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm text-sage-dark hover:bg-sage-light/20 rounded-lg transition-colors font-medium">
                      <span className="flex items-center gap-3">
                        <span className="text-base">🛍️</span> Go to Shop
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="p-2 border-t border-sage-light/20 bg-red-50/50">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-charcoal"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-sage-light/20 bg-white">
          <div className="px-4 py-4 border-b border-sage-light/20 bg-warm-white/50 flex items-center gap-3">
            <div className="w-10 h-10 bg-sage-light/30 rounded-full flex items-center justify-center text-sage-dark">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-charcoal">{profile?.full_name}</p>
              {profile?.instagram_handle && (
                <p className="text-xs text-charcoal-lighter">@{profile.instagram_handle}</p>
              )}
            </div>
          </div>
          <nav className="p-4 flex flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3",
                    isActive 
                      ? "bg-sage-light/20 text-sage-dark" 
                      : "text-charcoal-lighter hover:bg-warm-white"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
            
            <div className="h-px bg-sage-light/30 my-2" />
            
            <Link href="/influencer/dashboard/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-charcoal-lighter hover:bg-warm-white flex items-center gap-3">
              <UserIcon className="w-5 h-5" /> My Profile
            </Link>
            
            <a href="/" target="_blank" rel="noopener noreferrer" className="px-4 py-3 rounded-xl text-sm font-medium text-sage-dark bg-sage-light/10 flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span className="text-lg">🛍️</span> Go to Shop
              </span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button onClick={handleLogout} className="px-4 py-3 rounded-xl text-sm font-medium text-red-600 bg-red-50/50 mt-2 flex items-center gap-3 text-left">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
