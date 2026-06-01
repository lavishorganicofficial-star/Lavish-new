import type { Metadata } from 'next';
import { InventoryDashboard } from '@/components/admin/inventory/InventoryDashboard';

export const metadata: Metadata = { title: 'Stock & Inventory | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default function AdminInventoryPage() {
  return <InventoryDashboard />;
}
