import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { OrdersDashboard } from '@/components/admin/orders/OrdersDashboard';

export const metadata: Metadata = { title: 'Orders | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const supabase = await createAdminClient();
  const { q, status, page } = await searchParams;
  const currentPage = Number(page ?? 1);
  const pageSize = 20;

  let query = supabase
    .from('orders')
    .select('id, order_number, total, status, payment_status, payment_method, created_at, shipping_address, is_guest, guest_name, guest_phone, user_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

  if (q) query = query.ilike('order_number', `%${q}%`);
  if (status) query = query.eq('status', status);

  const { data: orders, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <OrdersDashboard 
      initialOrders={orders || []}
      count={count || 0}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}
