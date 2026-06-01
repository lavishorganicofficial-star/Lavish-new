import type { Metadata } from 'next';
import { ReportsDashboard } from '@/components/admin/payments/ReportsDashboard';

export const metadata: Metadata = { title: 'Payment Reports | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default function AdminPaymentReportsPage() {
  return <ReportsDashboard />;
}
