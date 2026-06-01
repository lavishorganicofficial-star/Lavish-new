import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CommandPalette } from '@/components/admin/CommandPalette';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  // Check role from JWT custom claim (set by Supabase Auth Hook)
  const jwtRole = (user.app_metadata as { user_role?: string })?.user_role;

  // Fallback: check the profiles table directly (works even without Auth Hook)
  let role = jwtRole;
  if (!role || role !== 'admin') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    role = profile?.role;
  }

  if (role !== 'admin') redirect('/');

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
