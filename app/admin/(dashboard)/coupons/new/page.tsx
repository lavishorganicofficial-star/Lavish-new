import type { Metadata } from 'next';
import CouponForm from '@/components/admin/CouponForm';

export const metadata: Metadata = { title: 'Add Coupon | LavishOrganic Admin' };

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <CouponForm />
    </div>
  );
}
