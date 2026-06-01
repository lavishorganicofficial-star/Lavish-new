import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { InfluencerDetailClient } from '@/components/admin/InfluencerDetailClient';

export default async function AdminInfluencerDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('influencer_profiles')
    .select(`
      *,
      profiles!influencer_profiles_id_fkey ( full_name, phone, referral_code )
    `)
    .eq('id', id)
    .single();

  if (!profile) return notFound();

  // Fetch recent commissions
  const { data: commissions } = await supabase
    .from('commission_transactions')
    .select('*, orders(shipping_address)')
    .eq('influencer_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch recent payouts
  const { data: payouts } = await supabase
    .from('influencer_payouts')
    .select('*')
    .eq('influencer_id', id)
    .order('created_at', { ascending: false });

  return (
    <InfluencerDetailClient 
      profile={profile as any} 
      commissions={commissions as any || []} 
      payouts={payouts as any || []} 
    />
  );
}
