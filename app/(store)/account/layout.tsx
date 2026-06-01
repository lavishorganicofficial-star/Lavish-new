import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AccountSidebar, MobileAccountHeader } from '@/components/store/AccountSidebar';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/account');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: influencerProfile } = await supabase
    .from('influencer_profiles')
    .select('id, status')
    .eq('id', user.id)
    .single();

  const isInfluencer = !!influencerProfile && influencerProfile.status === 'approved';

  return (
    <div className="container py-6 lg:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        <AccountSidebar profile={profile} userEmail={user.email ?? ''} isInfluencer={isInfluencer} />

        {/* Main Content */}
        <main className="lg:col-span-3">
          <MobileAccountHeader />
          {children}
        </main>
      </div>
    </div>
  );
}
