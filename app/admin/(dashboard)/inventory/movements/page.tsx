import type { Metadata } from 'next';
import { StockMovementsDashboard } from '@/components/admin/inventory/StockMovementsDashboard';

export const metadata: Metadata = { title: 'Stock Movements | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default function AdminStockMovementsPage() {
  return <StockMovementsDashboard />;
}
