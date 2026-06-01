import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OrderClient } from './OrderClient';

export const metadata: Metadata = { title: 'Order Details | LavishOrganic' };
export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  pending:                    'bg-amber-50 text-amber-700 border-amber-200',
  awaiting_cod_confirmation:  'bg-orange-50 text-orange-700 border-orange-200',
  confirmed:                  'bg-blue-50 text-blue-700 border-blue-200',
  processing:                 'bg-purple-50 text-purple-700 border-purple-200',
  packed:                     'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped:                    'bg-cyan-50 text-cyan-700 border-cyan-200',
  out_for_delivery:           'bg-teal-50 text-teal-700 border-teal-200',
  delivered:                  'bg-sage-50 text-sage-dark border-sage-light',
  cancelled:                  'bg-red-50 text-red-600 border-red-200',
  returned:                   'bg-rose-50 text-rose-600 border-rose-200',
  refunded:                   'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_STEPS = [
  { key: 'confirmed',       label: 'Confirmed' },
  { key: 'processing',      label: 'Processing' },
  { key: 'packed',          label: 'Packed' },
  { key: 'shipped',         label: 'Shipped' },
  { key: 'out_for_delivery',label: 'Out for Delivery' },
  { key: 'delivered',       label: 'Delivered' },
];

const STATUS_ORDER = [
  'pending', 'awaiting_cod_confirmation', 'confirmed',
  'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered',
];

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Must be logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/account/orders');

  // Fetch own order only (RLS enforces user_id = auth.uid())
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(id, product_name, image_url, quantity, unit_price, total_price, gst_rate)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !order) notFound();

  return <OrderClient initialOrder={order} />;
}
