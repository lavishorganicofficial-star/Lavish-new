'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User, Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast, useUIStore } from '@/store/uiStore';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AdminHeaderProps {
  user: SupabaseUser;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const toggleAdminSidebar = useUIStore((s) => s.toggleAdminSidebar);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <header className="h-14 bg-warm-white border-b border-sage-light/30 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleAdminSidebar}
          className="lg:hidden btn-icon" 
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block text-sm text-charcoal-lighter font-body">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <div className="flex items-center gap-2 pl-3 border-l border-sage-light/30">
          <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-sage-dark" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-charcoal font-body leading-tight">
              {user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Admin'}
            </p>
            <p className="text-[10px] text-charcoal-lighter font-body">Administrator</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="btn-icon text-charcoal-lighter hover:text-red-500" aria-label="Sign out" id="admin-signout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
