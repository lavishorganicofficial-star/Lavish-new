import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import OfferForm from '@/components/admin/OfferForm';

export const metadata: Metadata = { title: 'Edit Offer | LavishOrganic Admin' };

export default async function EditOfferPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from('offers')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!offer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <OfferForm initialData={offer} />
    </div>
  );
}
