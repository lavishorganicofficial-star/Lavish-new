import type { Metadata } from 'next';
import OfferForm from '@/components/admin/OfferForm';

export const metadata: Metadata = { title: 'Create Offer | LavishOrganic Admin' };

export default function NewOfferPage() {
  return (
    <div className="space-y-6">
      <OfferForm />
    </div>
  );
}
