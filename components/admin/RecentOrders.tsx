import Link from 'next/link';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface RecentOrdersProps {
  orders: Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    payment_status: string;
    payment_method: string;
    created_at: string;
    shipping_address: unknown;
  }>;
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'badge-yellow',
  awaiting_cod_confirmation: 'badge-yellow',
  confirmed: 'badge-blue',
  processing: 'badge-blue',
  shipped: 'badge-purple',
  out_for_delivery: 'badge-purple',
  delivered: 'badge-green',
  cancelled: 'badge-red',
  refunded: 'badge-red',
  returned: 'badge-red',
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="bg-warm-white rounded-xl shadow-warm border border-sage-light/20">
      <div className="flex items-center justify-between px-6 py-4 border-b border-sage-light/20">
        <h2 className="font-display text-base font-medium text-charcoal">Recent Orders</h2>
        <Link href="/admin/orders" className="text-xs text-sage-dark hover:underline font-body font-medium">
          View all →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const addr = order.shipping_address as { name?: string };
              return (
                <tr key={order.id}>
                  <td className="font-medium text-sage-dark hover:underline font-mono">
                    <Link href={`/admin/orders/${order.id}`}>
                      {order.order_number}
                    </Link>
                  </td>
                  <td>{addr?.name ?? '—'}</td>
                  <td className="text-charcoal-lighter">{formatDate(order.created_at)}</td>
                  <td className="font-semibold">{formatCurrency(order.total)}</td>
                  <td>
                    <span className={cn('badge text-[10px]', order.payment_method === 'cod' ? 'badge-yellow' : 'badge-green')}>
                      {order.payment_method === 'cod' ? 'COD' : 'Online'}
                    </span>
                  </td>
                  <td>
                    <span className={cn('badge text-[10px]', STATUS_CLASSES[order.status] ?? 'badge-gray')}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/orders/${order.id}`}
                      className="text-xs text-sage-dark hover:underline font-body">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-charcoal-lighter py-8 font-body text-sm">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LowStockAlert({ products }: { products: Array<{ id: string; name: string; stock_quantity: number; low_stock_threshold: number; images: Array<{ url: string; is_primary: boolean }> }> }) {
  return (
    <div className="bg-warm-white rounded-xl shadow-warm border border-sage-light/20">
      <div className="flex items-center justify-between px-5 py-4 border-b border-sage-light/20">
        <h2 className="font-display text-base font-medium text-charcoal">Low Stock</h2>
        <Link href="/admin/products?filter=low_stock" className="text-xs text-sage-dark hover:underline font-body font-medium">
          View all →
        </Link>
      </div>
      <div className="p-3 space-y-2">
        {products.map((product) => {
          const img = product.images?.find((i) => i.is_primary)?.url ?? product.images?.[0]?.url;
          return (
            <Link key={product.id} href={`/admin/products/${product.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-sage-50 transition-colors">
              <div className="w-10 h-10 rounded-md bg-sage-50 overflow-hidden flex-shrink-0">
                {img && <img src={img} alt={product.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal line-clamp-1 font-body">{product.name}</p>
                <p className="text-xs text-red-500 font-body">Stock: {product.stock_quantity}</p>
              </div>
            </Link>
          );
        })}
        {products.length === 0 && (
          <p className="text-sm text-charcoal-lighter text-center py-6 font-body">All products well-stocked ✓</p>
        )}
      </div>
    </div>
  );
}
