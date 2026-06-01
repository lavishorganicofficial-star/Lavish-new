import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InfluencerHeader } from '@/components/influencer/InfluencerHeader';
import { InfluencerFooter } from '@/components/influencer/InfluencerFooter';

export default async function InfluencerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/influencer/login?redirectTo=/influencer/dashboard');
  }

  // Check if they are an approved influencer
  const { data: influencerProfile } = await supabase
    .from('influencer_profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  if (influencerProfile?.status !== 'approved') {
    // If not approved yet or doesn't exist, they can't access the dashboard
    redirect('/influencer/join');
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-white">
      <InfluencerHeader />
      <main id="main-content" className="flex-1 py-8 md:py-12">
        <div className="container max-w-6xl px-4 md:px-6">
          {children}
        </div>
      </main>
      <InfluencerFooter />
    </div>
  );
}
