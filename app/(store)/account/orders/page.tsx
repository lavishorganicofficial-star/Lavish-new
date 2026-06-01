import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = { title: 'My Orders | LavishOrganic' };

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  awaiting_cod_confirmation: 'bg-orange-50 text-orange-700',
  confirmed: 'bg-blue-50 text-blue-700',
  processing: 'bg-purple-50 text-purple-700',
  packed: 'bg-indigo-50 text-indigo-700',
  shipped: 'bg-cyan-50 text-cyan-700',
  out_for_delivery: 'bg-teal-50 text-teal-700',
  delivered: 'bg-sage-50 text-sage-dark',
  cancelled: 'bg-red-50 text-red-600',
  returned: 'bg-rose-50 text-rose-600',
  refunded: 'bg-gray-50 text-gray-600',
};

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, order_number, total, status, payment_status, payment_method, created_at,
      items:order_items(id, quantity, unit_price, product:products(name, slug, images:product_images(url, is_primary)))
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-medium text-charcoal">My Orders</h1>

      {orders?.length ? (
        orders.map((order) => {
          const items = order.items as unknown as Array<{ id: string; quantity: number; unit_price: number; product: { name: string; slug: string; images: Array<{ url: string; is_primary: boolean }> } | null }>;
          const firstItem = items?.[0];
          const img = firstItem?.product?.images?.find(i => i.is_primary)?.url ?? firstItem?.product?.images?.[0]?.url;

          return (
            <div key={order.id} className="card p-5 hover:shadow-warm transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-sm font-bold text-charcoal">{order.order_number}</p>
                  <p className="text-xs text-charcoal-lighter mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-600'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-semibold text-charcoal">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Order items preview */}
              <div className="flex items-center gap-3 mb-4">
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="w-14 h-14 rounded-lg object-cover bg-sage-50" />
                )}
                <div>
                  <p className="text-sm text-charcoal">{firstItem?.product?.name ?? 'Product'}</p>
                  {items.length > 1 && (
                    <p className="text-xs text-charcoal-lighter">+{items.length - 1} more item{items.length > 2 ? 's' : ''}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-sage-light/20">
                <p className="text-xs text-charcoal-lighter">
                  {items.reduce((s, i) => s + i.quantity, 0)} items · {order.payment_method?.toUpperCase()}
                </p>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="text-sm text-sage-dark font-medium flex items-center gap-1 hover:gap-2 transition-all"
                >
                  View Details <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })
      ) : (
        <div className="card p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-sage-light mx-auto mb-4" />
          <h3 className="font-medium text-charcoal mb-2">No orders yet</h3>
          <p className="text-sm text-charcoal-lighter mb-6">Start shopping and your orders will appear here.</p>
          <Link href="/shop" className="btn-primary">Browse Products</Link>
        </div>
      )}
    </div>
  );
}
