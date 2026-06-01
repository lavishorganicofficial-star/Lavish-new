import type { Metadata } from 'next';
import { InventoryReportsDashboard } from '@/components/admin/inventory/InventoryReportsDashboard';

export const metadata: Metadata = { title: 'Inventory Reports | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default function AdminInventoryReportsPage() {
  return <InventoryReportsDashboard />;
}
