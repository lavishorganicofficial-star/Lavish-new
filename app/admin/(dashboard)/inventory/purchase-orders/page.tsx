import type { Metadata } from 'next';
import { PurchaseOrdersDashboard } from '@/components/admin/inventory/PurchaseOrdersDashboard';

export const metadata: Metadata = { title: 'Purchase Orders | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default function AdminPurchaseOrdersPage() {
  return <PurchaseOrdersDashboard />;
}
