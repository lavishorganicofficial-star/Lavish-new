import type { Metadata } from 'next';
import { RefundsDashboard } from '@/components/admin/payments/RefundsDashboard';

export const metadata: Metadata = { title: 'Refund Tracker | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default function AdminRefundsPage() {
  return <RefundsDashboard />;
}
