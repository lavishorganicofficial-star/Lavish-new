import type { Metadata } from 'next';
import { PaymentDashboard } from '@/components/admin/payments/PaymentDashboard';

export const metadata: Metadata = { title: 'Payments & Transactions | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default function AdminPaymentsPage() {
  return <PaymentDashboard />;
}
