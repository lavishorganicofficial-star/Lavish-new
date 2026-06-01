import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Tag, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Lock } from 'lucide-react';
import Link from 'next/link';
import DeleteCouponButton from '@/components/admin/DeleteCouponButton';

export const metadata: Metadata = { title: 'Coupons | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  const supabase = await createClient();

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Coupons</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">{coupons?.length ?? 0} coupons</p>
        </div>
        <Link href="/admin/coupons/new" className="btn-primary flex items-center gap-2" id="add-coupon-btn">
          <Plus className="w-4 h-4" /> Add Coupon
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sage-light/20 bg-sage-50/50">
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Code</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Type</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Value</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Min Order</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Usage</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Expires</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-light/10">
              {coupons?.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-sage-50/30 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-sm font-bold text-charcoal bg-sage-50 px-2 py-1 rounded">{coupon.code}</span>
                  </td>
                  <td className="p-4 text-sm text-charcoal-lighter capitalize">{coupon.type?.replace(/_/g, ' ')}</td>
                  <td className="p-4 text-sm font-medium text-charcoal">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                    {coupon.max_discount_amount && <span className="text-xs text-charcoal-lighter ml-1">(max ₹{coupon.max_discount_amount})</span>}
                  </td>
                  <td className="p-4 text-sm text-charcoal-lighter">{coupon.min_order_amount ? `₹${coupon.min_order_amount}` : '—'}</td>
                  <td className="p-4 text-sm text-charcoal-lighter">
                    {coupon.usage_count ?? 0}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' / ∞'}
                  </td>
                  <td className="p-4 text-xs text-charcoal-lighter">
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${coupon.is_active ? 'bg-sage-50 text-sage-dark' : 'bg-red-50 text-red-600'}`}>
                      {coupon.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {coupon.influencer_id && (
                        <span className="text-[10px] uppercase font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded flex items-center gap-1 mr-2" title="Influencer Coupon">
                          <Lock className="w-3 h-3" /> Influencer
                        </span>
                      )}
                      <Link href={`/admin/coupons/${coupon.id}`} className="btn-icon" aria-label="Edit coupon"><Edit className="w-4 h-4" /></Link>
                      {!coupon.influencer_id && (
                        <DeleteCouponButton id={coupon.id} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!coupons?.length && (
                <tr><td colSpan={8} className="p-12 text-center">
                  <Tag className="w-10 h-10 text-sage-light mx-auto mb-3" />
                  <p className="text-charcoal-lighter text-sm">No coupons yet. Create your first coupon!</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
