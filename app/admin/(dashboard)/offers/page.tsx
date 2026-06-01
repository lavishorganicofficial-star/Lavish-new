import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Megaphone, Plus, Edit } from 'lucide-react';
import Link from 'next/link';
import DeleteOfferButton from '@/components/admin/DeleteOfferButton';

export const metadata: Metadata = { title: 'Offers | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminOffersPage() {
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Offers & Flash Sales</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">{offers?.length ?? 0} offers</p>
        </div>
        <Link href="/admin/offers/new" className="btn-primary flex items-center gap-2" id="add-offer-btn">
          <Plus className="w-4 h-4" /> Create Offer
        </Link>
      </div>

      <div className="grid gap-4">
        {offers?.map((offer) => {
          const isActive = offer.is_active && new Date(offer.starts_at) <= now && new Date(offer.ends_at) > now;
          const isExpired = new Date(offer.ends_at) <= now;
          const isUpcoming = new Date(offer.starts_at) > now;

          return (
            <div key={offer.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-charcoal">{offer.title}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${isActive ? 'bg-sage-50 text-sage-dark' : isExpired ? 'bg-red-50 text-red-600' : isUpcoming ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                      {isActive ? '● Live' : isExpired ? 'Expired' : isUpcoming ? 'Upcoming' : 'Inactive'}
                    </span>
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full capitalize">{offer.type?.replace(/_/g, ' ')}</span>
                  </div>
                  {offer.description && <p className="text-sm text-charcoal-lighter mb-3">{offer.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-charcoal-lighter">
                    {offer.discount_percentage && <span>Discount: <strong className="text-charcoal">{offer.discount_percentage}%</strong></span>}
                    {offer.discount_amount && <span>Discount: <strong className="text-charcoal">₹{offer.discount_amount}</strong></span>}
                    <span>Start: <strong className="text-charcoal">{new Date(offer.starts_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong></span>
                    <span>End: <strong className="text-charcoal">{new Date(offer.ends_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/admin/offers/${offer.id}`} className="btn-icon" aria-label="Edit offer"><Edit className="w-4 h-4" /></Link>
                  <DeleteOfferButton id={offer.id} />
                </div>
              </div>
            </div>
          );
        })}
        {!offers?.length && (
          <div className="card p-12 text-center">
            <Megaphone className="w-10 h-10 text-sage-light mx-auto mb-3" />
            <p className="text-charcoal-lighter text-sm">No offers yet. Create your first flash sale!</p>
          </div>
        )}
      </div>
    </div>
  );
}
