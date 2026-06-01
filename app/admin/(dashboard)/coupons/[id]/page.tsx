import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CouponForm from '@/components/admin/CouponForm';

export const metadata: Metadata = { title: 'Edit Coupon | LavishOrganic Admin' };

export default async function EditCouponPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!coupon) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <CouponForm initialData={coupon} />
    </div>
  );
}
